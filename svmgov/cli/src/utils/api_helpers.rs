use std::{str::FromStr, time::Duration};

use anyhow::{Result, anyhow};
use log::{info, warn};
use ncn_snapshot_client::types::{MetaMerkleLeaf, StakeMerkleLeaf};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use solana_address::Address;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
const DEFAULT_MAX_RETRIES: usize = 3;
const RETRY_BASE_DELAY: Duration = Duration::from_secs(1);
const RETRY_MAX_DELAY: Duration = Duration::from_secs(8);
const RETRY_JITTER_MAX_MS: u64 = 250;

#[derive(Clone, Copy)]
struct RetryPolicy {
    max_retries: usize,
    base_delay: Duration,
    max_delay: Duration,
    jitter: bool,
}

const DEFAULT_RETRY_POLICY: RetryPolicy = RetryPolicy {
    max_retries: DEFAULT_MAX_RETRIES,
    base_delay: RETRY_BASE_DELAY,
    max_delay: RETRY_MAX_DELAY,
    jitter: true,
};

impl RetryPolicy {
    fn delay(self, retry_number: usize) -> Duration {
        let multiplier = 1_u32 << retry_number.min(3);
        let backoff = self
            .base_delay
            .saturating_mul(multiplier)
            .min(self.max_delay);
        let jitter = if self.jitter {
            Duration::from_millis(u64::from(rand::random::<u8>()) % (RETRY_JITTER_MAX_MS + 1))
        } else {
            Duration::ZERO
        };
        backoff + jitter
    }
}

fn response_error(
    status: reqwest::StatusCode,
    what: &str,
    base_url: &str,
    attempts: usize,
) -> anyhow::Error {
    if status == reqwest::StatusCode::NOT_FOUND {
        return anyhow!(
            "The operator API at {base_url} has no {what} for this snapshot slot (404). It may not \
             have uploaded this snapshot yet — retry, or point --operator-api-url at another operator."
        );
    }
    anyhow!(
        "The operator API at {base_url} returned {status} for the {what} after {attempts} attempt(s)."
    )
}

fn http_client() -> Result<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|error| anyhow!("Failed to build HTTP client: {error}"))
}

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

fn ensure_vote_account_matches(
    proof: &VoteAccountProofResponse,
    requested: &str,
    base_url: &str,
) -> Result<()> {
    let returned = &proof.meta_merkle_leaf.vote_account;
    if returned != requested {
        return Err(anyhow!(
            "The operator API at {base_url} returned a proof for vote account {returned} but \
             {requested} was requested."
        ));
    }

    Ok(())
}

fn ensure_stake_account_matches(
    proof: &StakeAccountProofResponse,
    requested: &str,
    base_url: &str,
) -> Result<()> {
    let returned = &proof.stake_merkle_leaf.stake_account;
    if returned != requested {
        return Err(anyhow!(
            "The operator API at {base_url} returned a proof for stake account {returned} but \
             {requested} was requested."
        ));
    }

    Ok(())
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

    let proof: VoteAccountProofResponse = fetch_json_with_retry(
        &http_client()?,
        &url,
        "vote account proof",
        &base_url,
        DEFAULT_RETRY_POLICY,
    )
    .await?;

    ensure_vote_account_matches(&proof, vote_account, &base_url)?;

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

    let proof: StakeAccountProofResponse = fetch_json_with_retry(
        &http_client()?,
        &url,
        "stake account proof",
        &base_url,
        DEFAULT_RETRY_POLICY,
    )
    .await?;

    ensure_stake_account_matches(&proof, stake_account, &base_url)?;

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
            voting_wallet: Address::from_str(&api_data.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey: {}", e))?,
            vote_account: Address::from_str(&api_data.vote_account)
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
            voting_wallet: Address::from_str(&api_data.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey: {}", e))?,
            stake_account: Address::from_str(&api_data.stake_account)
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
            voting_wallet: Address::default(), // Not available in summary
            vote_account: Address::from_str(&api_data.vote_account)
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
            voting_wallet: Address::default(), // Not available in summary
            stake_account: Address::from_str(&api_data.stake_account)
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

/// Convert API StakeMerkleLeafData directly to IDL-compatible StakeMerkleLeaf type
pub fn convert_stake_merkle_leaf_data_to_idl_type(
    stake_merkle_leaf_data: &StakeMerkleLeafData,
) -> Result<svmgov_client::types::StakeMerkleLeaf> {
    Ok(svmgov_client::types::StakeMerkleLeaf {
        voting_wallet: Address::from_str(&stake_merkle_leaf_data.voting_wallet)?,
        stake_account: Address::from_str(&stake_merkle_leaf_data.stake_account)?,
        active_stake: stake_merkle_leaf_data.active_stake,
    })
}

/// Generate MetaMerkleProof PDA for a given consensus result and vote account
pub fn generate_meta_merkle_proof_pda(
    consensus_result_pda: &Address,
    vote_account: &Address,
) -> Result<Address> {
    Ok(Address::find_program_address(
        &[
            b"MetaMerkleProof",
            consensus_result_pda.as_ref(),
            vote_account.as_ref(),
        ],
        &ncn_snapshot_client::NCN_SNAPSHOT_ID,
    )
    .0)
}

#[cfg(test)]
mod tests {
    use super::*;

    const REQUESTED_ACCOUNT: &str = "11111111111111111111111111111111";
    const OTHER_ACCOUNT: &str = "SysvarC1ock11111111111111111111111111111111";

    fn vote_account_proof(vote_account: &str) -> VoteAccountProofResponse {
        VoteAccountProofResponse {
            network: "mainnet".to_string(),
            snapshot_slot: 1,
            meta_merkle_leaf: MetaMerkleLeafData {
                voting_wallet: REQUESTED_ACCOUNT.to_string(),
                vote_account: vote_account.to_string(),
                stake_merkle_root: REQUESTED_ACCOUNT.to_string(),
                active_stake: 1,
            },
            meta_merkle_proof: vec![],
        }
    }

    fn stake_account_proof(stake_account: &str) -> StakeAccountProofResponse {
        StakeAccountProofResponse {
            network: "mainnet".to_string(),
            snapshot_slot: 1,
            stake_merkle_leaf: StakeMerkleLeafData {
                voting_wallet: REQUESTED_ACCOUNT.to_string(),
                stake_account: stake_account.to_string(),
                active_stake: 1,
            },
            stake_merkle_proof: vec![],
            vote_account: REQUESTED_ACCOUNT.to_string(),
        }
    }

    #[test]
    fn rejects_a_vote_proof_for_a_different_account() {
        assert!(
            ensure_vote_account_matches(
                &vote_account_proof(REQUESTED_ACCOUNT),
                REQUESTED_ACCOUNT,
                "https://operator.example",
            )
            .is_ok()
        );

        let error = ensure_vote_account_matches(
            &vote_account_proof(OTHER_ACCOUNT),
            REQUESTED_ACCOUNT,
            "https://operator.example",
        )
        .expect_err("a proof for another vote account must be rejected");

        assert!(error.to_string().contains(OTHER_ACCOUNT));
        assert!(error.to_string().contains(REQUESTED_ACCOUNT));
    }

    #[test]
    fn rejects_a_stake_proof_for_a_different_account() {
        assert!(
            ensure_stake_account_matches(
                &stake_account_proof(REQUESTED_ACCOUNT),
                REQUESTED_ACCOUNT,
                "https://operator.example",
            )
            .is_ok()
        );

        let error = ensure_stake_account_matches(
            &stake_account_proof(OTHER_ACCOUNT),
            REQUESTED_ACCOUNT,
            "https://operator.example",
        )
        .expect_err("a proof for another stake account must be rejected");

        assert!(error.to_string().contains(OTHER_ACCOUNT));
        assert!(error.to_string().contains(REQUESTED_ACCOUNT));
    }

    #[test]
    fn retries_transient_operator_statuses_but_not_missing_snapshots() {
        assert!(is_retryable_status(
            reqwest::StatusCode::SERVICE_UNAVAILABLE
        ));
        assert!(is_retryable_status(reqwest::StatusCode::TOO_MANY_REQUESTS));
        assert!(!is_retryable_status(reqwest::StatusCode::NOT_FOUND));
    }
}
