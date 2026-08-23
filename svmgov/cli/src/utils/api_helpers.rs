use std::str::FromStr;

use anchor_lang::prelude::Pubkey;
use anyhow::{anyhow, Result};
use log::info;
use ncn_snapshot::{MetaMerkleLeaf, MetaMerkleProof, StakeMerkleLeaf};
use serde::{Deserialize, Serialize};

fn is_retryable_status(status: reqwest::StatusCode) -> bool {
    status.is_server_error()
        || matches!(
            status,
            reqwest::StatusCode::FORBIDDEN
                | reqwest::StatusCode::REQUEST_TIMEOUT
                | reqwest::StatusCode::TOO_MANY_REQUESTS
        )
}

fn is_retryable_request_error(error: &reqwest::Error) -> bool {
    error.is_timeout() || error.is_connect() || error.is_body()
}

async fn wait_before_retry(
    policy: RetryPolicy,
    retry_number: usize,
    what: &str,
    base_url: &str,
    reason: &str,
) {
    let delay = policy.delay(retry_number);
    warn!(
        "Failed to get {what} from {base_url} ({reason}); retrying attempt {}/{} in {:.2?}",
        retry_number + 2,
        policy.max_retries + 1,
        delay
    );
    tokio::time::sleep(delay).await;
}

async fn fetch_json_with_retry<T: DeserializeOwned>(
    client: &reqwest::Client,
    url: &str,
    what: &str,
    base_url: &str,
    policy: RetryPolicy,
) -> Result<T> {
    for retry_number in 0..=policy.max_retries {
        let response = match client.get(url).send().await {
            Ok(response) => response,
            Err(error)
                if retry_number < policy.max_retries && is_retryable_request_error(&error) =>
            {
                wait_before_retry(policy, retry_number, what, base_url, &error.to_string()).await;
                continue;
            }
            Err(error) => {
                return Err(anyhow!(
                    "Failed to reach the operator API at {base_url} after {} attempt(s): {error}",
                    retry_number + 1,
                ));
            }
        };

        let status = response.status();
        if !status.is_success() {
            if retry_number < policy.max_retries && is_retryable_status(status) {
                wait_before_retry(policy, retry_number, what, base_url, &status.to_string()).await;
                continue;
            }
            return Err(response_error(status, what, base_url, retry_number + 1));
        }

        match response.json::<T>().await {
            Ok(value) => return Ok(value),
            Err(error)
                if retry_number < policy.max_retries && is_retryable_request_error(&error) =>
            {
                wait_before_retry(policy, retry_number, what, base_url, &error.to_string()).await;
            }
            Err(error) => {
                return Err(anyhow!(
                    "Malformed {what} from {base_url} after {} attempt(s): {error}",
                    retry_number + 1,
                ));
            }
        }
    }

    unreachable!("the retry loop always returns after its final attempt")
}

/// Vote account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountSummary {
    pub vote_account: String,
    pub active_stake: u64,
}

/// Stake account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountSummary {
    pub stake_account: String,
    pub active_stake: u64,
    pub vote_account: String,
}

/// Vote account proof endpoint response structure (/proof/vote_account/:vote_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountProofResponse {
    pub network: String,
    pub snapshot_slot: u64,
    pub meta_merkle_leaf: MetaMerkleLeafData,
    pub meta_merkle_proof: Vec<String>,
}

/// Stake account proof endpoint response structure (/proof/stake_account/:stake_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountProofResponse {
    pub network: String,
    pub snapshot_slot: u64,
    pub stake_merkle_leaf: StakeMerkleLeafData,
    pub stake_merkle_proof: Vec<String>,
    pub vote_account: String,
}

/// Meta merkle leaf data structure (for vote account proofs)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaMerkleLeafData {
    pub voting_wallet: String,
    pub vote_account: String,
    pub stake_merkle_root: String,
    pub active_stake: u64,
}

/// Stake merkle leaf data structure (for stake account proofs)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeMerkleLeafData {
    pub voting_wallet: String,
    pub stake_account: String,
    pub active_stake: u64,
}

/// Get merkle proof for a vote account
/// Endpoint: GET /proof/vote_account/:vote_account?snapshot_slot=...
pub async fn get_vote_account_proof(
    vote_account: &str,
    snapshot_slot: u64,
    network: &str,
) -> Result<VoteAccountProofResponse> {
    let base_url = get_api_base_url()?;
    let url = format!(
        "{}/proof/vote_account/{}?slot={}&network={}",
        base_url, vote_account, snapshot_slot, network
    );

    log::debug!("Fetching vote account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    info!("Response: {:?}", url);
    let proof: VoteAccountProofResponse = response.json().await?;

    log::debug!(
        "Got vote account proof: leaf stake={}, proof elements={}",
        proof.meta_merkle_leaf.active_stake,
        proof.meta_merkle_proof.len()
    );

    Ok(proof)
}

/// Get merkle proof for a stake account
/// Endpoint: GET /proof/stake_account/:stake_account?snapshot_slot=...
pub async fn get_stake_account_proof(
    stake_account: &str,
    snapshot_slot: u64,
    network: &str,
) -> Result<StakeAccountProofResponse> {
    let base_url = get_api_base_url()?;
    let url = format!(
        "{}/proof/stake_account/{}?network={}&slot={}",
        base_url, stake_account, network, snapshot_slot
    );

    log::debug!("Fetching stake account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    let proof: StakeAccountProofResponse = response.json().await?;

    log::debug!(
        "Got stake account proof: leaf stake={}, proof elements={}",
        proof.stake_merkle_leaf.active_stake,
        proof.stake_merkle_proof.len()
    );

    Ok(proof)
}

/// Get the base API URL from config
fn get_api_base_url() -> anyhow::Result<String> {
    let config = crate::config::Config::load()?;

    if config.operator_api_url.is_empty() {
        return Ok(crate::constants::DEFAULT_OPERATOR_API_URL.to_string());
    }

    info!("API base URL (from config): {}", config.operator_api_url);
    Ok(config.operator_api_url)
}

/// Convert API MetaMerkleLeafData to ncn_snapshot MetaMerkleLeaf
impl TryFrom<&MetaMerkleLeafData> for MetaMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(api_data: &MetaMerkleLeafData) -> Result<Self, Self::Error> {
        let stake_merkle_root_bytes = bs58::decode(&api_data.stake_merkle_root)
            .into_vec()
            .map_err(|e| anyhow!("Invalid stake_merkle_root: {}", e))?;

        if stake_merkle_root_bytes.len() != 32 {
            return Err(anyhow!("stake_merkle_root must be 32 bytes"));
        }

        let mut stake_merkle_root = [0u8; 32];
        stake_merkle_root.copy_from_slice(&stake_merkle_root_bytes);

        Ok(Self {
            voting_wallet: Pubkey::from_str(&api_data.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey: {}", e))?,
            vote_account: Pubkey::from_str(&api_data.vote_account)
                .map_err(|e| anyhow!("Invalid vote_account pubkey: {}", e))?,
            stake_merkle_root,
            active_stake: api_data.active_stake,
        })
    }
}

/// Convert API StakeMerkleLeafData to ncn_snapshot StakeMerkleLeaf
impl TryFrom<&StakeMerkleLeafData> for StakeMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(api_data: &StakeMerkleLeafData) -> Result<Self, Self::Error> {
        Ok(Self {
            voting_wallet: Pubkey::from_str(&api_data.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey: {}", e))?,
            stake_account: Pubkey::from_str(&api_data.stake_account)
                .map_err(|e| anyhow!("Invalid stake_account pubkey: {}", e))?,
            active_stake: api_data.active_stake,
        })
    }
}

/// Convert API VoteAccountSummary to ncn_snapshot MetaMerkleLeaf
impl TryFrom<&VoteAccountSummary> for MetaMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(api_data: &VoteAccountSummary) -> Result<Self, Self::Error> {
        Ok(Self {
            voting_wallet: Pubkey::default(), // Not available in summary
            vote_account: Pubkey::from_str(&api_data.vote_account)
                .map_err(|e| anyhow!("Invalid vote_account pubkey: {}", e))?,
            stake_merkle_root: [0u8; 32], // Not available in summary
            active_stake: api_data.active_stake,
        })
    }
}

/// Convert API StakeAccountSummary to ncn_snapshot StakeMerkleLeaf
impl TryFrom<&StakeAccountSummary> for StakeMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(api_data: &StakeAccountSummary) -> Result<Self, Self::Error> {
        Ok(Self {
            voting_wallet: Pubkey::default(), // Not available in summary
            stake_account: Pubkey::from_str(&api_data.stake_account)
                .map_err(|e| anyhow!("Invalid stake_account pubkey: {}", e))?,
            active_stake: api_data.active_stake,
        })
    }
}

/// Helper function to convert merkle proof strings to bytes
pub fn convert_merkle_proof_strings(proof_strings: &[String]) -> Result<Vec<[u8; 32]>> {
    proof_strings
        .iter()
        .map(|s| {
            let bytes_result = bs58::decode(s).into_vec();

            let bytes = match bytes_result {
                Ok(b) => b,
                Err(e) => return Err(anyhow!("Invalid base58 merkle proof hash: {}", e)),
            };

            if bytes.len() != 32 {
                return Err(anyhow!(
                    "Merkle proof hash must be 32 bytes, got {}",
                    bytes.len()
                ));
            }

            let mut hash = [0u8; 32];
            hash.copy_from_slice(&bytes);
            Ok(hash)
        })
        .collect()
}

/// TryFrom implementation to convert ncn_snapshot StakeMerkleLeaf to IDL-compatible StakeMerkleLeaf type
impl TryFrom<StakeMerkleLeaf> for crate::svmgov::types::StakeMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(ncn_snapshot_leaf: StakeMerkleLeaf) -> Result<Self, Self::Error> {
        Ok(Self {
            voting_wallet: ncn_snapshot_leaf.voting_wallet,
            stake_account: ncn_snapshot_leaf.stake_account,
            active_stake: ncn_snapshot_leaf.active_stake,
        })
    }
}

/// Convert API StakeMerkleLeafData directly to IDL-compatible StakeMerkleLeaf type
pub fn convert_stake_merkle_leaf_data_to_idl_type(
    stake_merkle_leaf_data: &StakeMerkleLeafData,
) -> Result<crate::svmgov::types::StakeMerkleLeaf> {
    // First convert to ncn_snapshot type, then to IDL type
    let ncn_snapshot_leaf: StakeMerkleLeaf = stake_merkle_leaf_data.try_into()?;
    ncn_snapshot_leaf.try_into()
}

/// Generate MetaMerkleProof PDA for a given consensus result and vote account
pub fn generate_meta_merkle_proof_pda(
    consensus_result_pda: &Pubkey,
    vote_account: &Pubkey,
) -> Result<Pubkey> {
    let (pda, _bump) = MetaMerkleProof::pda(consensus_result_pda, vote_account);
    Ok(pda)
}
