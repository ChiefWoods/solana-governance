use std::time::Duration;

use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};
use solana_address::Address;
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use svmgov_client::{SVMGOV_ID, accounts::GlobalConfig};

use crate::{constants::SPINNER_TICK_DURATION_MS, rpc};

pub use rpc::setup_all;

pub fn create_spinner(message: &str) -> ProgressBar {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(Duration::from_millis(SPINNER_TICK_DURATION_MS));
    spinner
}

pub fn derive_vote_pda(
    proposal: &Address,
    vote_account: &Address,
    program_id: &Address,
) -> Address {
    rpc::find_pda(
        &[b"vote", proposal.as_ref(), vote_account.as_ref()],
        program_id,
    )
}

pub fn derive_proposal_pda(seed: u64, vote_account: &Address, program_id: &Address) -> Address {
    rpc::find_pda(
        &[b"proposal", &seed.to_le_bytes(), vote_account.as_ref()],
        program_id,
    )
}

pub fn derive_proposal_index_pda(program_id: &Address) -> Address {
    rpc::find_pda(&[b"index"], program_id)
}

pub fn derive_support_pda(
    proposal: &Address,
    vote_account: &Address,
    program_id: &Address,
) -> Address {
    rpc::find_pda(
        &[b"support", proposal.as_ref(), vote_account.as_ref()],
        program_id,
    )
}

pub fn derive_vote_override_pda(
    proposal: &Address,
    stake_account: &Address,
    validator_vote: &Address,
    program_id: &Address,
) -> Address {
    rpc::find_pda(
        &[
            b"vote_override",
            proposal.as_ref(),
            stake_account.as_ref(),
            validator_vote.as_ref(),
        ],
        program_id,
    )
}

pub fn derive_vote_override_cache_pda(
    proposal: &Address,
    validator_vote: &Address,
    program_id: &Address,
) -> Address {
    rpc::find_pda(
        &[
            b"vote_override_cache",
            proposal.as_ref(),
            validator_vote.as_ref(),
        ],
        program_id,
    )
}

pub fn derive_global_config_pda(program_id: &Address) -> Address {
    rpc::find_pda(&[b"global_config"], program_id)
}

pub fn derive_program_data_pda(program_id: &Address) -> Address {
    rpc::find_pda(&[program_id.as_ref()], &rpc::bpf_loader_upgradeable_id())
}

pub fn derive_program_config_pda(program_id: &Address) -> Address {
    rpc::find_pda(&[b"ProgramConfig"], program_id)
}

pub async fn fetch_global_config(rpc_client: &RpcClient) -> Result<GlobalConfig> {
    let address = derive_global_config_pda(&SVMGOV_ID);
    let data = rpc_client
        .get_account_data(&address)
        .await
        .map_err(|e| anyhow!("Failed to fetch GlobalConfig: {e}"))?;
    GlobalConfig::from_bytes(&data).map_err(|e| anyhow!("Failed to decode GlobalConfig: {e}"))
}

pub async fn fetch_proposal(
    rpc_client: &RpcClient,
    address: &Address,
) -> Result<svmgov_client::accounts::Proposal> {
    let data = rpc_client
        .get_account_data(address)
        .await
        .map_err(|e| anyhow!("Failed to fetch proposal {address}: {e}"))?;
    svmgov_client::accounts::Proposal::from_bytes(&data)
        .map_err(|e| anyhow!("Failed to decode proposal {address}: {e}"))
}

pub async fn compute_vote_expiry_timestamp(rpc: &RpcClient, end_epoch: u64) -> Result<i64> {
    const MS_PER_SLOT: i64 = 400;
    const BUFFER_PCT: i64 = 20;
    const MIN_BUFFER_SECONDS: i64 = 3600;

    let info = rpc.get_epoch_info().await?;
    let epoch_start_slot = (info.absolute_slot - info.slot_index) as i64;
    let target_slot =
        epoch_start_slot + (end_epoch as i64 - info.epoch as i64) * info.slots_in_epoch as i64;
    let (ref_slot, ref_time) = block_time_at_or_before(rpc, info.absolute_slot).await?;
    let projected_secs = (target_slot - ref_slot as i64) * MS_PER_SLOT / 1000;
    let buffer = if projected_secs > 0 {
        std::cmp::max(projected_secs * BUFFER_PCT / 100, MIN_BUFFER_SECONDS)
    } else {
        0
    };
    Ok(ref_time + projected_secs + buffer)
}

async fn block_time_at_or_before(rpc: &RpcClient, mut slot: u64) -> Result<(u64, i64)> {
    let mut last_err = String::new();
    for _ in 0..8 {
        match rpc.get_block_time(slot).await {
            Ok(time) => return Ok((slot, time)),
            Err(err) => {
                last_err = err.to_string();
                slot = slot.saturating_sub(1);
            }
        }
    }
    Err(anyhow!("Failed to fetch a recent block time: {last_err}"))
}

pub fn get_epoch_slot_range(epoch: u64) -> (u64, u64) {
    const SLOTS_PER_EPOCH: u64 = 432_000;
    (epoch * SLOTS_PER_EPOCH, (epoch + 1) * SLOTS_PER_EPOCH - 1)
}
