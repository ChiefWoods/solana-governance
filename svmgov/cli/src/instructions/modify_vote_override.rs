use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::{ModifyVoteOverride, ModifyVoteOverrideInstructionArgs};

use crate::{
    constants::BASIS_POINTS_TOTAL,
    rpc,
    utils::{
        api_helpers::{
            self, convert_merkle_proof_strings, convert_stake_merkle_leaf_data_to_idl_type,
            get_stake_account_proof,
        },
        squads::{SquadsCliOpts, effective_signer},
        utils::{
            create_spinner, derive_vote_override_cache_pda, derive_vote_override_pda,
            derive_vote_pda, fetch_proposal,
        },
    },
};

#[allow(clippy::too_many_arguments)]
pub async fn modify_vote_override(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    staker_keypair: String,
    rpc_url: Option<String>,
    stake_account: String,
    vote_account: String,
    network: String,
    squads: Option<SquadsCliOpts>,
) -> Result<()> {
    if for_votes + against_votes + abstain_votes != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {BASIS_POINTS_TOTAL}"
        ));
    }
    let proposal_address = Address::from_str(&proposal_id)?;
    let vote_account = Address::from_str(&vote_account)?;
    let stake_account = Address::from_str(&stake_account)?;
    let (payer, rpc_client) = rpc::setup_all_with_staker(staker_keypair, rpc_url)?;
    let proposal = fetch_proposal(&rpc_client, &proposal_address).await?;
    let consensus_result = proposal
        .consensus_result
        .ok_or_else(|| anyhow!("Proposal consensus_result is not set"))?;
    let proof =
        get_stake_account_proof(&stake_account.to_string(), proposal.snapshot_slot, &network)
            .await?;
    let meta_merkle_proof =
        api_helpers::generate_meta_merkle_proof_pda(&consensus_result, &vote_account)?;
    let validator_vote = derive_vote_pda(&proposal_address, &vote_account, &rpc::program_id());
    let vote_override = derive_vote_override_pda(
        &proposal_address,
        &stake_account,
        &validator_vote,
        &rpc::program_id(),
    );
    let vote_override_cache =
        derive_vote_override_cache_pda(&proposal_address, &validator_vote, &rpc::program_id());
    let ix = ModifyVoteOverride {
        signer: effective_signer(squads.as_ref(), payer.pubkey()),
        proposal: proposal_address,
        validator_vote,
        spl_vote_account: vote_account,
        vote_override,
        vote_override_cache,
        spl_stake_account: stake_account,
        snapshot_program: rpc::snapshot_program_id(),
        consensus_result,
        meta_merkle_proof,
        system_program: rpc::system_program_id(),
    }
    .instruction(ModifyVoteOverrideInstructionArgs {
        for_votes_bp: for_votes,
        against_votes_bp: against_votes,
        abstain_votes_bp: abstain_votes,
        stake_merkle_proof: convert_merkle_proof_strings(&proof.stake_merkle_proof)?,
        stake_merkle_leaf: convert_stake_merkle_leaf_data_to_idl_type(&proof.stake_merkle_leaf)?,
    });
    let config = squads.as_ref().map(|opts| opts.to_config(payer.pubkey()));
    let spinner = create_spinner("Modifying vote override...");
    let outcome = crate::utils::squads::route(
        &rpc_client,
        vec![ix],
        vec![],
        &[payer.as_ref()],
        config.as_ref(),
    )
    .await?;
    spinner.finish_and_clear();
    println!("{}", outcome.format_structured());
    Ok(())
}
