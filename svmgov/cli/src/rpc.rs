//! Solana RPC helpers and PDA derivation for the CLI.
//!
//! Uses the Codama `svmgov-client` types (`solana_address::Address`,
//! `solana_instruction::Instruction`) rather than Anchor's `Program` client.

use std::{fs, str::FromStr, sync::Arc};

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_instruction::Instruction;
use solana_keypair::Keypair;
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use solana_sdk_ids::{bpf_loader_upgradeable, system_program};
use solana_signer::Signer;
use solana_transaction::Transaction;
use svmgov_client::SVMGOV_ID;

use crate::constants::{DEFAULT_RPC_URL, DEFAULT_WSS_URL, SNAPSHOT_PROGRAM_ID};

#[allow(dead_code)]
pub type Pubkey = Address;

pub fn program_id() -> Address {
    SVMGOV_ID
}

pub fn snapshot_program_id() -> Address {
    SNAPSHOT_PROGRAM_ID
}

pub fn system_program_id() -> Address {
    Address::new_from_array(system_program::ID.to_bytes())
}

pub fn bpf_loader_upgradeable_id() -> Address {
    Address::new_from_array(bpf_loader_upgradeable::ID.to_bytes())
}

pub fn rpc_url(rpc_url: Option<String>) -> String {
    rpc_url.unwrap_or_else(|| DEFAULT_RPC_URL.to_string())
}

pub fn rpc_client(url: &str) -> RpcClient {
    RpcClient::new(url.to_string())
}

/// Kept for callers that still format a websocket URL alongside the RPC URL.
#[allow(dead_code)]
pub fn wss_url(rpc_url: &str) -> String {
    if rpc_url == DEFAULT_RPC_URL {
        DEFAULT_WSS_URL.to_string()
    } else {
        rpc_url.replace("https://", "wss://")
    }
}

pub fn load_keypair_from_file(path: &str) -> Result<Keypair> {
    let file_content = fs::read_to_string(path).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => {
            anyhow!("The specified keypair file does not exist: {path}")
        }
        _ => anyhow!("Failed to read keypair file {path}: {e}"),
    })?;

    let keypair_bytes: Vec<u8> = serde_json::from_str(&file_content).map_err(|e| {
        anyhow!("The keypair file is not a valid JSON array of bytes: {path}. Error: {e}")
    })?;

    Keypair::try_from(keypair_bytes.as_slice()).map_err(|e| {
        anyhow!(
            "The provided bytes do not form a valid Solana keypair: {e}. This might be due to invalid key data."
        )
    })
}

pub fn load_identity_keypair(keypair_path: Option<String>) -> Result<Keypair> {
    let Some(path) = keypair_path else {
        return Err(anyhow!(
            "No identity keypair path provided. Please specify the path using the --keypair flag."
        ));
    };
    let keypair = load_keypair_from_file(&path)?;
    println!("Loaded identity keypair address -> {:?}", keypair.pubkey());
    Ok(keypair)
}

pub fn find_pda(seeds: &[&[u8]], program_id: &Address) -> Address {
    Address::find_program_address(seeds, program_id).0
}

#[allow(dead_code)]
pub async fn fetch_account<T: borsh::BorshDeserialize>(
    rpc: &RpcClient,
    address: &Address,
) -> Result<T> {
    let data = rpc
        .get_account_data(address)
        .await
        .map_err(|e| anyhow!("Failed to fetch account {address}: {e}"))?;
    T::try_from_slice(&data).map_err(|e| anyhow!("Failed to deserialize account {address}: {e}"))
}

pub async fn send_instructions(
    rpc: &RpcClient,
    instructions: &[Instruction],
    payer: &Keypair,
) -> Result<solana_signature::Signature> {
    let blockhash = rpc.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        instructions,
        Some(&payer.pubkey()),
        &[payer],
        blockhash,
    );
    rpc.send_and_confirm_transaction(&tx)
        .await
        .map_err(|e| anyhow!(e))
}

pub async fn account_exists(rpc: &RpcClient, address: &Address) -> bool {
    rpc.get_account_data(address).await.is_ok()
}

pub async fn setup_signer(
    keypair_path: Option<String>,
    rpc_url_opt: Option<String>,
) -> Result<(Arc<Keypair>, RpcClient)> {
    let identity_keypair = Arc::new(load_identity_keypair(keypair_path)?);
    let rpc = rpc_client(&rpc_url(rpc_url_opt));
    log::debug!(
        "setup_signer completed successfully: payer_pubkey={}",
        identity_keypair.pubkey()
    );
    Ok((identity_keypair, rpc))
}

pub async fn setup_all(
    keypair_path: Option<String>,
    rpc_url_opt: Option<String>,
) -> Result<(Arc<Keypair>, Address, RpcClient)> {
    let (identity_keypair, rpc) = setup_signer(keypair_path, rpc_url_opt).await?;
    let vote_account = find_spl_vote_account(&identity_keypair.pubkey(), &rpc).await?;
    log::debug!(
        "setup_all completed successfully: payer_pubkey={}, vote_account={}",
        identity_keypair.pubkey(),
        vote_account
    );
    Ok((identity_keypair, vote_account, rpc))
}

pub fn setup_all_with_staker(
    staker_keypair_path: String,
    rpc_url_opt: Option<String>,
) -> Result<(Arc<Keypair>, RpcClient)> {
    let staker_keypair = Arc::new(load_keypair_from_file(&staker_keypair_path)?);
    let rpc = rpc_client(&rpc_url(rpc_url_opt));
    log::debug!(
        "setup_all_with_staker completed successfully: staker_pubkey={}",
        staker_keypair.pubkey()
    );
    Ok((staker_keypair, rpc))
}

pub async fn setup_admin(
    keypair_path: Option<String>,
    rpc_url_opt: Option<String>,
) -> Result<(Arc<Keypair>, RpcClient)> {
    setup_signer(keypair_path, rpc_url_opt).await
}

async fn find_spl_vote_account(
    validator_identity: &Address,
    rpc_client: &RpcClient,
) -> Result<Address> {
    let vote_accounts = rpc_client.get_vote_accounts().await?;
    let vote_account = vote_accounts
        .current
        .iter()
        .find(|vote_acc| vote_acc.node_pubkey == validator_identity.to_string())
        .ok_or_else(|| anyhow!("No Vote account found associated with this validator identity"))?;
    Ok(Address::from_str(&vote_account.vote_pubkey)?)
}
