use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::FinalizeProposal;

use crate::{rpc, utils::utils::create_spinner};

pub async fn finalize_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Address::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, rpc_client) = rpc::setup_signer(identity_keypair, rpc_url).await?;

    let spinner = create_spinner("Finalizing proposal...");

    let ix = FinalizeProposal {
        signer: payer.pubkey(),
        proposal: proposal_pubkey,
    }
    .instruction();
    let sig = rpc::send_instructions(&rpc_client, &[ix], &payer).await?;

    spinner.finish_with_message(format!(
        "Proposal finalized successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
