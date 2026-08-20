//! Conversions between Agave 4.x (`solana-sdk`) types and the Codama client.
//!
//! The ncn CLI keeps Agave 4 for ledger/bank work. The Codama client uses
//! `solana_address::Address` and `solana_instruction::Instruction` (3.x). These
//! helpers convert at that boundary so instruction builders and account
//! decoding stay typed without mixing the two stacks.

use anyhow::{anyhow, Context, Result};
use ncn_snapshot_client::{
    accounts::{BallotBox, ConsensusResult, MetaMerkleProof, ProgramConfig},
    types::{MetaMerkleLeaf as ClientMetaMerkleLeaf, StakeMerkleLeaf as ClientStakeMerkleLeaf},
    NCN_SNAPSHOT_ID,
};
use ncn_snapshot::{MetaMerkleLeaf, StakeMerkleLeaf};
use solana_address::Address;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{instruction::Instruction, pubkey::Pubkey};

use anchor_lang::prelude::Pubkey as SquadsPubkey;
use anchor_lang::solana_program::instruction::{
    AccountMeta as SquadsAccountMeta, Instruction as SquadsInstruction,
};

pub const SYSTEM_PROGRAM: Address =
    solana_address::address!("11111111111111111111111111111111");

pub fn program_id() -> Pubkey {
    from_address(NCN_SNAPSHOT_ID)
}

pub fn to_address(pubkey: Pubkey) -> Address {
    Address::new_from_array(pubkey.to_bytes())
}

pub fn from_address(address: Address) -> Pubkey {
    Pubkey::new_from_array(address.to_bytes())
}

pub fn to_squads_pubkey(pubkey: Pubkey) -> SquadsPubkey {
    SquadsPubkey::new_from_array(pubkey.to_bytes())
}

pub fn from_squads_pubkey(pubkey: SquadsPubkey) -> Pubkey {
    Pubkey::new_from_array(pubkey.to_bytes())
}

pub fn to_squads_ix(ix: Instruction) -> SquadsInstruction {
    SquadsInstruction {
        program_id: to_squads_pubkey(ix.program_id),
        accounts: ix
            .accounts
            .into_iter()
            .map(|meta| SquadsAccountMeta {
                pubkey: to_squads_pubkey(meta.pubkey),
                is_signer: meta.is_signer,
                is_writable: meta.is_writable,
            })
            .collect(),
        data: ix.data,
    }
}

pub fn from_squads_ix(ix: SquadsInstruction) -> Instruction {
    Instruction {
        program_id: from_squads_pubkey(ix.program_id),
        accounts: ix
            .accounts
            .into_iter()
            .map(|meta| solana_sdk::instruction::AccountMeta {
                pubkey: from_squads_pubkey(meta.pubkey),
                is_signer: meta.is_signer,
                is_writable: meta.is_writable,
            })
            .collect(),
        data: ix.data,
    }
}

pub fn to_sdk_ix(ix: solana_instruction::Instruction) -> Instruction {
    Instruction {
        program_id: Pubkey::new_from_array(ix.program_id.to_bytes()),
        accounts: ix
            .accounts
            .into_iter()
            .map(|meta| solana_sdk::instruction::AccountMeta {
                pubkey: Pubkey::new_from_array(meta.pubkey.to_bytes()),
                is_signer: meta.is_signer,
                is_writable: meta.is_writable,
            })
            .collect(),
        data: ix.data,
    }
}

pub fn to_client_meta_leaf(leaf: &MetaMerkleLeaf) -> ClientMetaMerkleLeaf {
    ClientMetaMerkleLeaf {
        voting_wallet: Address::new_from_array(leaf.voting_wallet.to_bytes()),
        vote_account: Address::new_from_array(leaf.vote_account.to_bytes()),
        stake_merkle_root: leaf.stake_merkle_root,
        active_stake: leaf.active_stake,
    }
}

pub fn to_client_stake_leaf(leaf: &StakeMerkleLeaf) -> ClientStakeMerkleLeaf {
    ClientStakeMerkleLeaf {
        voting_wallet: Address::new_from_array(leaf.voting_wallet.to_bytes()),
        stake_account: Address::new_from_array(leaf.stake_account.to_bytes()),
        active_stake: leaf.active_stake,
    }
}

pub fn program_config_pda() -> Pubkey {
    Pubkey::find_program_address(&[b"ProgramConfig"], &program_id()).0
}

pub fn ballot_box_pda(snapshot_slot: u64) -> Pubkey {
    Pubkey::find_program_address(&[b"BallotBox", &snapshot_slot.to_le_bytes()], &program_id()).0
}

pub fn consensus_result_pda(snapshot_slot: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[b"ConsensusResult", &snapshot_slot.to_le_bytes()],
        &program_id(),
    )
    .0
}

pub fn meta_merkle_proof_pda(consensus_result: &Pubkey, vote_account: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            b"MetaMerkleProof",
            consensus_result.as_ref(),
            vote_account.as_ref(),
        ],
        &program_id(),
    )
    .0
}

pub fn fetch_program_config(rpc: &RpcClient) -> Result<ProgramConfig> {
    fetch_account(rpc, &program_config_pda(), ProgramConfig::from_bytes)
}

pub fn fetch_ballot_box(rpc: &RpcClient, snapshot_slot: u64) -> Result<BallotBox> {
    fetch_account(rpc, &ballot_box_pda(snapshot_slot), BallotBox::from_bytes)
}

pub fn fetch_consensus_result(rpc: &RpcClient, snapshot_slot: u64) -> Result<ConsensusResult> {
    fetch_account(
        rpc,
        &consensus_result_pda(snapshot_slot),
        ConsensusResult::from_bytes,
    )
}

pub fn fetch_meta_merkle_proof(rpc: &RpcClient, pda: &Pubkey) -> Result<MetaMerkleProof> {
    fetch_account(rpc, pda, MetaMerkleProof::from_bytes)
}

pub fn account_exists(rpc: &RpcClient, address: &Pubkey) -> bool {
    rpc.get_account_data(address).is_ok()
}

fn fetch_account<T>(
    rpc: &RpcClient,
    address: &Pubkey,
    from_bytes: fn(&[u8]) -> Result<T, std::io::Error>,
) -> Result<T> {
    let data = rpc
        .get_account_data(address)
        .with_context(|| format!("failed to fetch account {address}"))?;
    from_bytes(&data).map_err(|err| anyhow!("failed to decode account {address}: {err}"))
}
