use std::str::FromStr;

use anyhow::{Result, anyhow};
use ncn_snapshot_client::{
    instructions::{InitMetaMerkleProof, InitMetaMerkleProofInstructionArgs},
    types::MetaMerkleLeaf,
};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::{CastVote, CastVoteInstructionArgs};

use crate::{
    constants::BASIS_POINTS_TOTAL,
    rpc,
    utils::{
        api_helpers::{self, convert_merkle_proof_strings, get_vote_account_proof},
        utils::{
            compute_vote_expiry_timestamp, create_spinner, derive_vote_override_cache_pda,
            derive_vote_pda, fetch_proposal,
        },
    },
};

#[allow(clippy::too_many_arguments)]
pub async fn cast_vote(
    proposal_id: String,
    votes_for: u64,
    votes_against: u64,
    abstain: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    network: String,
    close_timestamp_override: Option<i64>,
) -> Result<()> {
    if votes_for + votes_against + abstain != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {BASIS_POINTS_TOTAL}"
        ));
    }
    let proposal_address = Address::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {proposal_id}"))?;
    let (payer, vote_account, rpc_client) = rpc::setup_all(identity_keypair, rpc_url).await?;
    let proposal = fetch_proposal(&rpc_client, &proposal_address).await?;
    let consensus_result = proposal
        .consensus_result
        .ok_or_else(|| anyhow!("Proposal consensus_result is not set"))?;
    let proof =
        get_vote_account_proof(&vote_account.to_string(), proposal.snapshot_slot, &network).await?;
    let proof_vote_account = Address::from_str(&proof.meta_merkle_leaf.vote_account)?;
    let meta_merkle_proof =
        api_helpers::generate_meta_merkle_proof_pda(&consensus_result, &proof_vote_account)?;
    let vote = derive_vote_pda(&proposal_address, &vote_account, &rpc::program_id());
    let vote_override_cache =
        derive_vote_override_cache_pda(&proposal_address, &vote, &rpc::program_id());

    if !rpc::account_exists(&rpc_client, &meta_merkle_proof).await {
        let close_timestamp = match close_timestamp_override {
            Some(value) => value,
            None => compute_vote_expiry_timestamp(&rpc_client, proposal.end_epoch).await?,
        };
        let init_ix = InitMetaMerkleProof {
            payer: payer.pubkey(),
            merkle_proof: meta_merkle_proof,
            consensus_result,
            system_program: rpc::system_program_id(),
        }
        .instruction(InitMetaMerkleProofInstructionArgs {
            meta_merkle_leaf: MetaMerkleLeaf {
                voting_wallet: Address::from_str(&proof.meta_merkle_leaf.voting_wallet)?,
                vote_account: proof_vote_account,
                stake_merkle_root: Address::from_str(&proof.meta_merkle_leaf.stake_merkle_root)?
                    .to_bytes(),
                active_stake: proof.meta_merkle_leaf.active_stake,
            },
            meta_merkle_proof: convert_merkle_proof_strings(&proof.meta_merkle_proof)?,
            close_timestamp,
        });
        let sig = rpc::send_instructions(&rpc_client, &[init_ix], &payer).await?;
        log::info!("Meta merkle proof initialized: {sig}");
    } else if close_timestamp_override.is_some() {
        log::warn!("--close-timestamp ignored because the MetaMerkleProof account already exists");
    }

    let ix = CastVote {
        signer: payer.pubkey(),
        proposal: proposal_address,
        vote,
        spl_vote_account: vote_account,
        vote_override_cache,
        snapshot_program: rpc::snapshot_program_id(),
        consensus_result,
        meta_merkle_proof,
        system_program: rpc::system_program_id(),
    }
    .instruction(CastVoteInstructionArgs {
        for_votes_bp: votes_for,
        against_votes_bp: votes_against,
        abstain_votes_bp: abstain,
    });
    let spinner = create_spinner("Sending cast-vote transaction...");
    let sig = rpc::send_instructions(&rpc_client, &[ix], &payer).await?;
    spinner.finish_with_message(format!(
        "Vote cast successfully. https://explorer.solana.com/tx/{sig}"
    ));
    Ok(())
}
