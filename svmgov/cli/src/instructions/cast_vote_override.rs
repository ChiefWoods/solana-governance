use std::str::FromStr;

use anyhow::{Result, anyhow};
use ncn_snapshot_client::{
    instructions::{InitMetaMerkleProof, InitMetaMerkleProofInstructionArgs},
    types::MetaMerkleLeaf,
};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::{CastVoteOverride, CastVoteOverrideInstructionArgs};

use crate::{
    constants::BASIS_POINTS_TOTAL,
    rpc,
    utils::{
        api_helpers::{
            self, convert_merkle_proof_strings, convert_stake_merkle_leaf_data_to_idl_type,
            get_stake_account_proof, get_vote_account_proof,
        },
        squads::{SquadsCliOpts, effective_signer},
        utils::{
            compute_vote_expiry_timestamp, create_spinner, derive_vote_override_cache_pda,
            derive_vote_override_pda, derive_vote_pda, fetch_proposal,
        },
    },
};

#[allow(clippy::too_many_arguments)]
pub async fn cast_vote_override(
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
    close_timestamp_override: Option<i64>,
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
    let meta_proof =
        get_vote_account_proof(&vote_account.to_string(), proposal.snapshot_slot, &network).await?;
    let stake_proof =
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

    let mut preflight_ixs = vec![];
    if !rpc::account_exists(&rpc_client, &meta_merkle_proof).await {
        let close_timestamp = match close_timestamp_override {
            Some(value) => value,
            None => compute_vote_expiry_timestamp(&rpc_client, proposal.end_epoch).await?,
        };
        preflight_ixs.push(
            InitMetaMerkleProof {
                payer: payer.pubkey(),
                merkle_proof: meta_merkle_proof,
                consensus_result,
                system_program: rpc::system_program_id(),
            }
            .instruction(InitMetaMerkleProofInstructionArgs {
                meta_merkle_leaf: MetaMerkleLeaf::try_from(&meta_proof.meta_merkle_leaf)?,
                meta_merkle_proof: convert_merkle_proof_strings(&meta_proof.meta_merkle_proof)?,
                close_timestamp,
            }),
        );
    } else if close_timestamp_override.is_some() {
        log::warn!("--close-timestamp ignored because the MetaMerkleProof account already exists");
    }

    let ix = CastVoteOverride {
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
    .instruction(CastVoteOverrideInstructionArgs {
        for_votes_bp: for_votes,
        against_votes_bp: against_votes,
        abstain_votes_bp: abstain_votes,
        stake_merkle_proof: convert_merkle_proof_strings(&stake_proof.stake_merkle_proof)?,
        stake_merkle_leaf: convert_stake_merkle_leaf_data_to_idl_type(
            &stake_proof.stake_merkle_leaf,
        )?,
    });
    let config = squads.as_ref().map(|opts| opts.to_config(payer.pubkey()));
    let spinner = create_spinner("Sending vote override transaction...");
    let outcome = crate::utils::squads::route(
        &rpc_client,
        vec![ix],
        preflight_ixs,
        &[payer.as_ref()],
        config.as_ref(),
    )
    .await?;
    spinner.finish_and_clear();
    println!("{}", outcome.format_structured());
    Ok(())
}
