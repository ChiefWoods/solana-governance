use std::str::FromStr;

use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_signer::Signer;
use svmgov_client::instructions::{
    AcceptAdmin, InitializeConfig, InitializeConfigInstructionArgs, NominateAdmin,
    NominateAdminInstructionArgs, UpdateConfig, UpdateConfigInstructionArgs,
};

use crate::{
    rpc,
    utils::{
        squads::{SquadsCliOpts, effective_signer},
        utils::{
            create_spinner, derive_global_config_pda, derive_program_data_pda, fetch_global_config,
        },
    },
};

fn validate_config_values(
    title: Option<u16>,
    description: Option<u16>,
    support_bps: Option<u64>,
    supporters: Option<u32>,
) -> Result<()> {
    if title.is_some_and(|v| v == 0 || v > 200) {
        return Err(anyhow!("max_title_length must be between 1 and 200 bytes"));
    }
    if description.is_some_and(|v| v == 0 || v > 500) {
        return Err(anyhow!(
            "max_description_length must be between 1 and 500 bytes"
        ));
    }
    if support_bps.is_some_and(|v| v > 10_000) {
        return Err(anyhow!("cluster_support_pct_min_bps must be at most 10000"));
    }
    if supporters.is_some_and(|v| v == 0 || v > 2_000) {
        return Err(anyhow!("max_supporters must be between 1 and 2000"));
    }
    Ok(())
}

async fn route_one(
    rpc_client: &solana_rpc_client::nonblocking::rpc_client::RpcClient,
    payer: &solana_keypair::Keypair,
    ix: solana_instruction::Instruction,
    squads: Option<&SquadsCliOpts>,
) -> Result<()> {
    let config = squads.map(|opts| opts.to_config(payer.pubkey()));
    let outcome =
        crate::utils::squads::route(rpc_client, vec![ix], vec![], &[payer], config.as_ref())
            .await?;
    println!("{}", outcome.format_structured());
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub async fn initialize_global_config(
    keypair: Option<String>,
    rpc_url: Option<String>,
    max_title_length: u16,
    max_description_length: u16,
    max_support_epochs: u64,
    min_proposal_stake_lamports: u64,
    cluster_support_pct_min_bps: u64,
    discussion_epochs: u64,
    voting_epochs: u64,
    snapshot_epoch_extension: u64,
    snapshot_slot_offset: i64,
    max_supporters: u32,
    squads: Option<SquadsCliOpts>,
) -> Result<()> {
    validate_config_values(
        Some(max_title_length),
        Some(max_description_length),
        Some(cluster_support_pct_min_bps),
        Some(max_supporters),
    )?;
    let (payer, rpc_client) = rpc::setup_admin(keypair, rpc_url).await?;
    let admin = effective_signer(squads.as_ref(), payer.pubkey());
    let program_data = derive_program_data_pda(&rpc::program_id());
    if let Ok(data) = rpc_client.get_account_data(&program_data).await {
        if data.len() >= 45 && data[12] == 1 {
            let authority = Address::new_from_array(data[13..45].try_into().unwrap());
            if authority != admin {
                return Err(anyhow!(
                    "Signer {admin} is not the program's upgrade authority ({authority})"
                ));
            }
        }
    }
    let ix = InitializeConfig {
        admin,
        global_config: derive_global_config_pda(&rpc::program_id()),
        system_program: rpc::system_program_id(),
        program: rpc::program_id(),
        program_data,
    }
    .instruction(InitializeConfigInstructionArgs {
        max_title_length,
        max_description_length,
        max_support_epochs,
        min_proposal_stake_lamports,
        cluster_support_pct_min_bps,
        discussion_epochs,
        voting_epochs,
        snapshot_epoch_extension,
        snapshot_slot_offset,
        max_supporters,
    });
    let spinner = create_spinner("Initializing global config...");
    route_one(&rpc_client, &payer, ix, squads.as_ref()).await?;
    spinner.finish_and_clear();
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub async fn update_global_config(
    keypair: Option<String>,
    rpc_url: Option<String>,
    max_title_length: Option<u16>,
    max_description_length: Option<u16>,
    max_support_epochs: Option<u64>,
    min_proposal_stake_lamports: Option<u64>,
    cluster_support_pct_min_bps: Option<u64>,
    discussion_epochs: Option<u64>,
    voting_epochs: Option<u64>,
    snapshot_epoch_extension: Option<u64>,
    snapshot_slot_offset: Option<i64>,
    max_supporters: Option<u32>,
    squads: Option<SquadsCliOpts>,
) -> Result<()> {
    validate_config_values(
        max_title_length,
        max_description_length,
        cluster_support_pct_min_bps,
        max_supporters,
    )?;
    let (payer, rpc_client) = rpc::setup_admin(keypair, rpc_url).await?;
    let ix = UpdateConfig {
        admin: effective_signer(squads.as_ref(), payer.pubkey()),
        global_config: derive_global_config_pda(&rpc::program_id()),
        system_program: rpc::system_program_id(),
    }
    .instruction(UpdateConfigInstructionArgs {
        max_title_length,
        max_description_length,
        max_support_epochs,
        min_proposal_stake_lamports,
        cluster_support_pct_min_bps,
        discussion_epochs,
        voting_epochs,
        snapshot_epoch_extension,
        snapshot_slot_offset,
        max_supporters,
    });
    route_one(&rpc_client, &payer, ix, squads.as_ref()).await
}

pub async fn nominate_admin(
    keypair: Option<String>,
    new_admin: String,
    rpc_url: Option<String>,
    squads: Option<SquadsCliOpts>,
) -> Result<()> {
    let proposed_admin = Address::from_str(&new_admin)?;
    let (payer, rpc_client) = rpc::setup_admin(keypair, rpc_url).await?;
    let ix = NominateAdmin {
        admin: effective_signer(squads.as_ref(), payer.pubkey()),
        global_config: derive_global_config_pda(&rpc::program_id()),
    }
    .instruction(NominateAdminInstructionArgs { proposed_admin });
    route_one(&rpc_client, &payer, ix, squads.as_ref()).await
}

pub async fn accept_admin(
    keypair: Option<String>,
    rpc_url: Option<String>,
    squads: Option<SquadsCliOpts>,
) -> Result<()> {
    let (payer, rpc_client) = rpc::setup_admin(keypair, rpc_url).await?;
    let ix = AcceptAdmin {
        new_admin: effective_signer(squads.as_ref(), payer.pubkey()),
        global_config: derive_global_config_pda(&rpc::program_id()),
    }
    .instruction();
    route_one(&rpc_client, &payer, ix, squads.as_ref()).await
}

pub async fn show_global_config(rpc_url: Option<String>) -> Result<()> {
    let rpc_client = rpc::rpc_client(&rpc::rpc_url(rpc_url));
    let config = fetch_global_config(&rpc_client).await?;
    println!("\nOn-chain Global Config:");
    println!("  admin:                       {}", config.admin);
    println!(
        "  pending_admin:               {}",
        config
            .pending_admin
            .map(|v| v.to_string())
            .unwrap_or_else(|| "none".into())
    );
    println!("  max_title_length:            {}", config.max_title_length);
    println!(
        "  max_description_length:      {}",
        config.max_description_length
    );
    println!(
        "  max_support_epochs:          {}",
        config.max_support_epochs
    );
    println!(
        "  min_proposal_stake_lamports: {}",
        config.min_proposal_stake_lamports
    );
    println!(
        "  cluster_support_pct_min_bps: {}",
        config.cluster_support_pct_min_bps
    );
    println!(
        "  discussion_epochs:           {}",
        config.discussion_epochs
    );
    println!("  voting_epochs:               {}", config.voting_epochs);
    println!(
        "  snapshot_epoch_extension:    {}",
        config.snapshot_epoch_extension
    );
    println!(
        "  snapshot_slot_offset:        {}",
        config.snapshot_slot_offset
    );
    println!("  max_supporters:              {}", config.max_supporters);
    Ok(())
}
