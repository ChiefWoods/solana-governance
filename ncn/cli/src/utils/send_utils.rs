use anyhow::{anyhow, Result};
use ncn_snapshot::{MetaMerkleLeaf, StakeMerkleLeaf};
use ncn_snapshot_client::{
    instructions::{
        CastVote, CastVoteInstructionArgs, CloseMetaMerkleProof, FinalizeBallot,
        FinalizeProposedAuthority, InitBallotBox, InitBallotBoxInstructionArgs, InitMetaMerkleProof,
        InitMetaMerkleProofInstructionArgs, InitProgramConfig, InitProgramConfigInstructionArgs,
        RemoveVote, ResetBallotBox, SetTieBreaker, SetTieBreakerInstructionArgs,
        UpdateOperatorWhitelist, UpdateOperatorWhitelistInstructionArgs, UpdateProgramConfig,
        UpdateProgramConfigInstructionArgs, VerifyMerkleProof, VerifyMerkleProofInstructionArgs,
    },
    types::Ballot,
};
use solana_client::rpc_client::RpcClient;
use solana_compute_budget_interface::ComputeBudgetInstruction;
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    transaction::Transaction,
};

use crate::utils::convert::{
    program_config_pda, to_address, to_client_meta_leaf, to_client_stake_leaf, to_sdk_ix,
    SYSTEM_PROGRAM,
};
use crate::utils::squads::{
    effective_signer, route_via_squads, RoutedOutcome, SquadsRoutingConfig,
};

pub struct TxSender<'a> {
    pub rpc: RpcClient,
    pub micro_lamports: Option<u64>,
    pub payer: &'a Keypair,
    pub authority: &'a Keypair,
    /// When set, transaction-creating commands are routed through this Squads
    /// multisig vault instead of being signed and sent locally.
    pub squads: Option<SquadsRoutingConfig>,
}

impl<'a> TxSender<'a> {
    pub fn send(&self, ixs: Vec<Instruction>) -> Result<Signature> {
        send_transaction(
            ixs,
            self.micro_lamports,
            &[self.payer, self.authority],
            &self.rpc,
            self.payer,
        )
    }

    pub fn send_with_signers(
        &self,
        ixs: Vec<Instruction>,
        signers: &[&Keypair],
    ) -> Result<Signature> {
        send_transaction(ixs, self.micro_lamports, signers, &self.rpc, self.payer)
    }

    /// Routes `ixs` either directly (local sign + send) or through the configured
    /// Squads multisig vault.
    pub fn route(
        &self,
        ixs: Vec<Instruction>,
        direct_signers: &[&Keypair],
    ) -> Result<RoutedOutcome> {
        match self.squads.as_ref() {
            None => {
                let signature = send_transaction(
                    ixs,
                    self.micro_lamports,
                    direct_signers,
                    &self.rpc,
                    self.payer,
                )?;
                Ok(RoutedOutcome::Direct {
                    signature,
                    slot: None,
                })
            }
            Some(config) => route_via_squads(&self.rpc, ixs, self.payer, config),
        }
    }
}

fn send_transaction(
    mut ixs: Vec<Instruction>,
    micro_lamports: Option<u64>,
    signers: &[&Keypair],
    rpc: &RpcClient,
    payer: &Keypair,
) -> Result<Signature> {
    let blockhash = rpc.get_latest_blockhash()?;

    if let Some(lamports) = micro_lamports {
        ixs.insert(
            0,
            ComputeBudgetInstruction::set_compute_unit_price(lamports),
        );
    }

    let tx = Transaction::new_signed_with_payer(&ixs, Some(&payer.pubkey()), signers, blockhash);
    rpc.send_and_confirm_transaction(&tx)
        .map_err(|err| anyhow!(err.to_string()))
}

pub fn send_init_program_config(
    tx_sender: &TxSender,
    svmgov_program_pubkey: Pubkey,
) -> Result<RoutedOutcome> {
    let payer = effective_signer(tx_sender.squads.as_ref(), tx_sender.payer.pubkey());
    let authority = effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = InitProgramConfig {
        payer: to_address(payer),
        authority: to_address(authority),
        program_config: to_address(program_config_pda()),
        system_program: SYSTEM_PROGRAM,
    }
    .instruction(InitProgramConfigInstructionArgs {
        svmgov_program_pubkey: to_address(svmgov_program_pubkey),
    });

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}

pub fn send_update_operator_whitelist(
    tx_sender: &TxSender,
    operators_to_add: Option<Vec<Pubkey>>,
    operators_to_remove: Option<Vec<Pubkey>>,
) -> Result<RoutedOutcome> {
    let authority = effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = UpdateOperatorWhitelist {
        authority: to_address(authority),
        program_config: to_address(program_config_pda()),
    }
    .instruction(UpdateOperatorWhitelistInstructionArgs {
        operators_to_add: operators_to_add.map(|ops| ops.into_iter().map(to_address).collect()),
        operators_to_remove: operators_to_remove
            .map(|ops| ops.into_iter().map(to_address).collect()),
    });

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}

pub fn send_update_program_config(
    tx_sender: &TxSender,
    proposed_authority: Option<Pubkey>,
    min_consensus_threshold_bps: Option<u16>,
    tie_breaker_admin: Option<Pubkey>,
    vote_duration: Option<i64>,
    svmgov_program_pubkey: Option<Pubkey>,
) -> Result<RoutedOutcome> {
    let authority = effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = UpdateProgramConfig {
        authority: to_address(authority),
        program_config: to_address(program_config_pda()),
    }
    .instruction(UpdateProgramConfigInstructionArgs {
        proposed_authority: proposed_authority.map(to_address),
        min_consensus_threshold_bps,
        tie_breaker_admin: tie_breaker_admin.map(to_address),
        vote_duration,
        svmgov_program_pubkey: svmgov_program_pubkey.map(to_address),
    });

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}

pub fn send_cast_vote(tx_sender: &TxSender, ballot_box: Pubkey, ballot: Ballot) -> Result<Signature> {
    let ix = CastVote {
        operator: to_address(tx_sender.authority.pubkey()),
        ballot_box: to_address(ballot_box),
    }
    .instruction(CastVoteInstructionArgs { ballot });

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_cast_and_remove_votes(
    tx_sender: &TxSender,
    ballot_box: Pubkey,
    ballots: Vec<Ballot>,
) -> Result<Signature> {
    let mut ixs = Vec::new();
    for ballot in ballots {
        let cast_ix = CastVote {
            operator: to_address(tx_sender.authority.pubkey()),
            ballot_box: to_address(ballot_box),
        }
        .instruction(CastVoteInstructionArgs { ballot });
        ixs.push(to_sdk_ix(cast_ix));
        let remove_ix = RemoveVote {
            operator: to_address(tx_sender.authority.pubkey()),
            ballot_box: to_address(ballot_box),
        }
        .instruction();
        ixs.push(to_sdk_ix(remove_ix));
    }
    tx_sender.send(ixs)
}

pub fn send_init_ballot_box(
    tx_sender: &TxSender,
    ballot_box: Pubkey,
    snapshot_slot: u64,
) -> Result<Signature> {
    let ix = InitBallotBox {
        payer: to_address(tx_sender.payer.pubkey()),
        proposal: to_address(tx_sender.authority.pubkey()),
        ballot_box: to_address(ballot_box),
        program_config: to_address(program_config_pda()),
        system_program: SYSTEM_PROGRAM,
    }
    .instruction(InitBallotBoxInstructionArgs {
        snapshot_slot,
        proposal_seed: 0,
        spl_vote_account: to_address(Pubkey::default()),
    });

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_remove_vote(tx_sender: &TxSender, ballot_box: Pubkey) -> Result<Signature> {
    let ix = RemoveVote {
        operator: to_address(tx_sender.authority.pubkey()),
        ballot_box: to_address(ballot_box),
    }
    .instruction();

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_finalize_ballot(
    tx_sender: &TxSender,
    ballot_box: Pubkey,
    consensus_result: Pubkey,
) -> Result<Signature> {
    let ix = FinalizeBallot {
        payer: to_address(tx_sender.payer.pubkey()),
        ballot_box: to_address(ballot_box),
        consensus_result: to_address(consensus_result),
        system_program: SYSTEM_PROGRAM,
    }
    .instruction();

    tx_sender.send_with_signers(vec![to_sdk_ix(ix)], &[tx_sender.payer])
}

pub fn send_set_tie_breaker(
    tx_sender: &TxSender,
    ballot_box: Pubkey,
    ballot: Ballot,
) -> Result<RoutedOutcome> {
    let tie_breaker_admin =
        effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = SetTieBreaker {
        tie_breaker_admin: to_address(tie_breaker_admin),
        ballot_box: to_address(ballot_box),
        program_config: to_address(program_config_pda()),
    }
    .instruction(SetTieBreakerInstructionArgs { ballot });

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}

pub fn send_reset_ballot_box(tx_sender: &TxSender, ballot_box: Pubkey) -> Result<RoutedOutcome> {
    let tie_breaker_admin =
        effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = ResetBallotBox {
        tie_breaker_admin: to_address(tie_breaker_admin),
        ballot_box: to_address(ballot_box),
        program_config: to_address(program_config_pda()),
    }
    .instruction();

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}

pub fn send_init_meta_merkle_proof(
    tx_sender: &TxSender,
    meta_merkle_proof_pda: Pubkey,
    consensus_result: Pubkey,
    meta_merkle_leaf: MetaMerkleLeaf,
    meta_merkle_proof: Vec<[u8; 32]>,
    close_timestamp: i64,
) -> Result<Signature> {
    let ix = InitMetaMerkleProof {
        payer: to_address(tx_sender.payer.pubkey()),
        merkle_proof: to_address(meta_merkle_proof_pda),
        consensus_result: to_address(consensus_result),
        system_program: SYSTEM_PROGRAM,
    }
    .instruction(InitMetaMerkleProofInstructionArgs {
        meta_merkle_leaf: to_client_meta_leaf(&meta_merkle_leaf),
        meta_merkle_proof,
        close_timestamp,
    });

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_verify_merkle_proof(
    tx_sender: &TxSender,
    consensus_result: Pubkey,
    meta_merkle_proof: Pubkey,
    stake_merkle_proof: Option<Vec<[u8; 32]>>,
    stake_merkle_leaf: Option<StakeMerkleLeaf>,
) -> Result<Signature> {
    let ix = VerifyMerkleProof {
        consensus_result: to_address(consensus_result),
        meta_merkle_proof: to_address(meta_merkle_proof),
    }
    .instruction(VerifyMerkleProofInstructionArgs {
        stake_merkle_proof,
        stake_merkle_leaf: stake_merkle_leaf.as_ref().map(to_client_stake_leaf),
    });

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_close_meta_merkle_proof(
    tx_sender: &TxSender,
    meta_merkle_proof: Pubkey,
) -> Result<Signature> {
    let ix = CloseMetaMerkleProof {
        payer: to_address(tx_sender.payer.pubkey()),
        meta_merkle_proof: to_address(meta_merkle_proof),
        system_program: SYSTEM_PROGRAM,
    }
    .instruction();

    tx_sender.send(vec![to_sdk_ix(ix)])
}

pub fn send_finalize_proposed_authority(tx_sender: &TxSender) -> Result<RoutedOutcome> {
    let authority = effective_signer(tx_sender.squads.as_ref(), tx_sender.authority.pubkey());
    let ix = FinalizeProposedAuthority {
        authority: to_address(authority),
        program_config: to_address(program_config_pda()),
    }
    .instruction();

    tx_sender.route(vec![to_sdk_ix(ix)], &[tx_sender.payer, tx_sender.authority])
}
