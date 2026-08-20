use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::{ModifyVote, ModifyVoteInstructionArgs};

use crate::{
    constants::*,
    rpc,
    utils::{
        api_helpers::{self, get_vote_account_proof},
        utils::{create_spinner, derive_vote_pda, fetch_proposal, setup_all},
    },
};

pub async fn modify_vote(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    network: String,
) -> Result<()> {
    if for_votes + against_votes + abstain_votes != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {}",
            BASIS_POINTS_TOTAL
        ));
    }

    let proposal_pubkey = Address::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, rpc_client) = setup_all(identity_keypair, rpc_url).await?;

    // Fetch proposal to get snapshot_slot and consensus_result
    let proposal = fetch_proposal(&rpc_client, &proposal_pubkey).await?;

    let snapshot_slot = proposal.snapshot_slot;
    let consensus_result_pda = proposal
        .consensus_result
        .ok_or_else(|| anyhow!("Proposal consensus_result is not set"))?;

    let proof_response =
        get_vote_account_proof(&vote_account.to_string(), snapshot_slot, &network).await?;

    // Generate meta_merkle_proof_pda using the consensus_result from proposal
    let vote_account_pubkey = Address::from_str(&proof_response.meta_merkle_leaf.vote_account)
        .map_err(|e| anyhow!("Invalid vote_account pubkey in response: {}", e))?;
    let meta_merkle_proof_pda =
        api_helpers::generate_meta_merkle_proof_pda(&consensus_result_pda, &vote_account_pubkey)?;

    let vote_pda = derive_vote_pda(&proposal_pubkey, &vote_account, &rpc::program_id());

    let spinner = create_spinner("Modifying vote...");

    let ix = ModifyVote {
        signer: payer.pubkey(),
        proposal: proposal_pubkey,
        vote: vote_pda,
        spl_vote_account: vote_account,
        snapshot_program: rpc::snapshot_program_id(),
        consensus_result: consensus_result_pda,
        meta_merkle_proof: meta_merkle_proof_pda,
        system_program: rpc::system_program_id(),
    }
    .instruction(ModifyVoteInstructionArgs {
        for_votes_bp: for_votes,
        against_votes_bp: against_votes,
        abstain_votes_bp: abstain_votes,
    });
    let sig = rpc::send_instructions(&rpc_client, &[ix], &payer).await?;

    spinner.finish_with_message(format!(
        "Vote modified successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
