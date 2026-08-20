use anyhow::Result;
use solana_signer::Signer;
use svmgov_client::instructions::{CreateProposal, CreateProposalInstructionArgs};

use crate::{
    instructions::support_proposal::build_support_proposal_instructions,
    rpc,
    utils::proposal_link::validate_description,
    utils::utils::{
        create_spinner, derive_global_config_pda, derive_proposal_index_pda, derive_proposal_pda,
        setup_all,
    },
};

pub async fn create_proposal(
    proposal_title: String,
    proposal_description: String,
    seed: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    _network: String,
    skip_link_check: bool,
    with_support: bool,
) -> Result<()> {
    log::debug!(
        "create_proposal: title={}, description={}, seed={:?}, identity_keypair={:?}, rpc_url={:?}, with_support={}",
        proposal_title,
        proposal_description,
        seed,
        identity_keypair,
        rpc_url,
        with_support
    );

    // Validated before loading a keypair, touching RPC, or starting a spinner, so a bad link
    // fails immediately and cleanly rather than as an opaque custom program error. The
    // normalized link is what gets submitted, so the value we checked is the value the program
    // sees — a description with surrounding whitespace would otherwise fail on chain.
    let proposal_description = validate_description(&proposal_description, skip_link_check).await?;

    let (payer, vote_account, rpc_client) = setup_all(identity_keypair, rpc_url).await?;

    let seed_value = seed.unwrap_or_else(rand::random::<u64>);

    let proposal_pda = derive_proposal_pda(seed_value, &vote_account, &rpc::program_id());

    let proposal_index_pda = derive_proposal_index_pda(&rpc::program_id());
    let global_config_pda = derive_global_config_pda(&rpc::program_id());

    // Create proposal - snapshot_slot and consensus_result will be set later in support_proposal
    let spinner = create_spinner(if with_support {
        "Creating and supporting proposal..."
    } else {
        "Creating proposal..."
    });

    let mut instructions = vec![
        CreateProposal {
            signer: payer.pubkey(),
            proposal: proposal_pda,
            proposal_index: proposal_index_pda,
            spl_vote_account: vote_account,
            global_config: global_config_pda,
            system_program: rpc::system_program_id(),
        }
        .instruction(CreateProposalInstructionArgs {
            seed: seed_value,
            title: proposal_title,
            description: proposal_description,
        }),
    ];

    if with_support {
        let support_proposal_ixs = build_support_proposal_instructions(
            &rpc_client,
            payer.pubkey(),
            proposal_pda,
            vote_account,
        )
        .await?;

        instructions.extend(support_proposal_ixs);
    }

    let sig = rpc::send_instructions(&rpc_client, &instructions, &payer).await?;
    log::debug!(
        "Proposal creation transaction sent successfully: signature={}",
        sig
    );

    spinner.finish_with_message(format!(
        "Proposal {} created{}. https://explorer.solana.com/tx/{}",
        proposal_pda,
        if with_support { " and supported" } else { "" },
        sig
    ));

    Ok(())
}
