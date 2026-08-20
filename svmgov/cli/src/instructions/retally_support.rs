use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_compute_budget_interface::ComputeBudgetInstruction;
use solana_signer::Signer;
use svmgov_client::instructions::RetallySupport;

use crate::{
    constants::{MAX_SUPPORTERS_LIMIT, support_compute_unit_limit},
    rpc,
    utils::utils::{
        create_spinner, derive_global_config_pda, derive_program_config_pda, fetch_global_config,
        fetch_proposal, get_epoch_slot_range,
    },
};

pub async fn retally_support(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    _network: String,
) -> Result<()> {
    let proposal_address = Address::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {proposal_id}"))?;
    let (payer, rpc_client) = rpc::setup_signer(identity_keypair, rpc_url).await?;
    let config = fetch_global_config(&rpc_client).await?;
    let num_supporters = fetch_proposal(&rpc_client, &proposal_address)
        .await
        .map(|p| p.num_supporters)
        .unwrap_or(MAX_SUPPORTERS_LIMIT);

    let epoch = rpc_client.get_epoch_info().await?.epoch;
    let target_epoch = epoch + config.discussion_epochs + config.snapshot_epoch_extension;
    let (start_slot, _) = get_epoch_slot_range(target_epoch);
    let snapshot_slot = ((start_slot as i64) + config.snapshot_slot_offset) as u64;
    let ballot_box = rpc::find_pda(
        &[b"BallotBox", &snapshot_slot.to_le_bytes()],
        &rpc::snapshot_program_id(),
    );

    let instructions = vec![
        ComputeBudgetInstruction::set_compute_unit_limit(support_compute_unit_limit(
            num_supporters,
        )),
        RetallySupport {
            signer: payer.pubkey(),
            proposal: proposal_address,
            ballot_box,
            ballot_program: rpc::snapshot_program_id(),
            program_config: derive_program_config_pda(&rpc::snapshot_program_id()),
            global_config: derive_global_config_pda(&rpc::program_id()),
            system_program: rpc::system_program_id(),
        }
        .instruction(),
    ];
    let spinner = create_spinner("Re-tallying proposal support...");
    let sig = rpc::send_instructions(&rpc_client, &instructions, &payer).await?;
    spinner.finish_with_message(format!(
        "Proposal support re-tallied. https://explorer.solana.com/tx/{sig}"
    ));
    Ok(())
}
