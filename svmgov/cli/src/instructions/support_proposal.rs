use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_compute_budget_interface::ComputeBudgetInstruction;
use solana_instruction::Instruction;
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use solana_signer::Signer;
use svmgov_client::instructions::SupportProposal;

use crate::{
    constants::{MAX_SUPPORTERS_LIMIT, support_compute_unit_limit},
    rpc,
    utils::utils::{
        create_spinner, derive_global_config_pda, derive_program_config_pda, derive_support_pda,
        fetch_global_config, fetch_proposal, get_epoch_slot_range,
    },
};

pub async fn build_support_proposal_instructions(
    rpc_client: &RpcClient,
    signer: Address,
    proposal: Address,
    vote_account: Address,
) -> Result<Vec<Instruction>> {
    let global_config = fetch_global_config(rpc_client).await?;
    let epoch = rpc_client.get_epoch_info().await?.epoch;
    let target_epoch =
        epoch + global_config.discussion_epochs + global_config.snapshot_epoch_extension;
    let (start_slot, _) = get_epoch_slot_range(target_epoch);
    let snapshot_slot = ((start_slot as i64) + global_config.snapshot_slot_offset) as u64;
    let ballot_box = rpc::find_pda(
        &[b"BallotBox", &snapshot_slot.to_le_bytes()],
        &rpc::snapshot_program_id(),
    );

    Ok(vec![
        SupportProposal {
            signer,
            proposal,
            support: derive_support_pda(&proposal, &vote_account, &rpc::program_id()),
            spl_vote_account: vote_account,
            ballot_box,
            ballot_program: rpc::snapshot_program_id(),
            program_config: derive_program_config_pda(&rpc::snapshot_program_id()),
            global_config: derive_global_config_pda(&rpc::program_id()),
            system_program: rpc::system_program_id(),
        }
        .instruction(),
    ])
}

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    _network: String,
) -> Result<()> {
    let proposal = Address::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {proposal_id}"))?;
    let (payer, vote_account, rpc_client) = rpc::setup_all(identity_keypair, rpc_url).await?;

    let num_supporters = match fetch_proposal(&rpc_client, &proposal).await {
        Ok(account) => {
            if account.finalized {
                return Err(anyhow!(
                    "Proposal {proposal} is finalized; support is closed."
                ));
            }
            if account.voting {
                return Err(anyhow!(
                    "Proposal {proposal} has already reached its support threshold."
                ));
            }
            account.num_supporters
        }
        Err(err) => {
            log::warn!("Could not read supporter count: {err}");
            MAX_SUPPORTERS_LIMIT
        }
    };

    let mut instructions = vec![ComputeBudgetInstruction::set_compute_unit_limit(
        support_compute_unit_limit(num_supporters),
    )];
    instructions.extend(
        build_support_proposal_instructions(&rpc_client, payer.pubkey(), proposal, vote_account)
            .await?,
    );
    let spinner = create_spinner("Supporting proposal...");
    let sig = rpc::send_instructions(&rpc_client, &instructions, &payer).await?;
    spinner.finish_with_message(format!(
        "Proposal supported. https://explorer.solana.com/tx/{sig}"
    ));
    Ok(())
}
