use anyhow::Result;
use solana_signer::Signer;
use svmgov_client::instructions::InitializeIndex;

use crate::{
    rpc,
    utils::utils::{create_spinner, derive_proposal_index_pda},
};

pub async fn initialize_index(
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // init-index is permissionless on-chain: the signer only pays rent for the
    // ProposalIndex PDA. Use setup_admin (no vote-account lookup) rather than
    // setup_all, which requires the signer to be a validator identity.
    let (payer, rpc_client) = rpc::setup_admin(identity_keypair, rpc_url).await?;

    let proposal_index = derive_proposal_index_pda(&rpc::program_id());

    let spinner = create_spinner("Sending init_index transaction...");

    let ix = InitializeIndex {
        signer: payer.pubkey(),
        proposal_index,
        system_program: rpc::system_program_id(),
    }
    .instruction();
    let sig = rpc::send_instructions(&rpc_client, &[ix], &payer).await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    spinner.finish_with_message(format!(
        "Proposal index initialized successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    log::debug!("init_index completed successfully");
    Ok(())
}
