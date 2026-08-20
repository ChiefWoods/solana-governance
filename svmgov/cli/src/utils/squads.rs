use anyhow::{Result, anyhow};
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_program::{
    instruction::{AccountMeta as SquadsAccountMeta, Instruction as SquadsInstruction},
    pubkey::Pubkey as SquadsPubkey,
};
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use solana_signature::Signature;
use solana_signer::Signer;
use solana_transaction::Transaction;
use squads_client::{Multisig, SquadsClient};

const MAX_INDEX_ATTEMPTS: u8 = 3;

fn to_squads_pubkey(address: Address) -> SquadsPubkey {
    SquadsPubkey::new_from_array(address.to_bytes())
}

fn from_squads_pubkey(pubkey: SquadsPubkey) -> Address {
    Address::new_from_array(pubkey.to_bytes())
}

fn to_squads_ix(ix: Instruction) -> SquadsInstruction {
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

fn from_squads_ix(ix: SquadsInstruction) -> Instruction {
    Instruction {
        program_id: from_squads_pubkey(ix.program_id),
        accounts: ix
            .accounts
            .into_iter()
            .map(|meta| AccountMeta {
                pubkey: from_squads_pubkey(meta.pubkey),
                is_signer: meta.is_signer,
                is_writable: meta.is_writable,
            })
            .collect(),
        data: ix.data,
    }
}

#[derive(Clone, Debug)]
pub struct SquadsCliOpts {
    pub multisig: Address,
    pub vault_index: u8,
    pub program_id: Option<Address>,
    pub memo: Option<String>,
}

impl SquadsCliOpts {
    pub fn to_config(&self, proposer: Address) -> SquadsRoutingConfig {
        SquadsRoutingConfig {
            multisig: self.multisig,
            vault_index: self.vault_index,
            proposer,
            program_id: self.program_id,
            memo: self.memo.clone(),
        }
    }

    pub fn vault_pubkey(&self) -> Address {
        from_squads_pubkey(
            squads_client::vault_pda(
                &to_squads_pubkey(self.multisig),
                self.vault_index,
                self.program_id.map(to_squads_pubkey).as_ref(),
            )
            .0,
        )
    }
}

pub fn effective_signer(squads: Option<&SquadsCliOpts>, local: Address) -> Address {
    squads.map(SquadsCliOpts::vault_pubkey).unwrap_or(local)
}

#[derive(Clone, Debug)]
pub struct SquadsRoutingConfig {
    pub multisig: Address,
    pub vault_index: u8,
    pub proposer: Address,
    pub program_id: Option<Address>,
    pub memo: Option<String>,
}

#[derive(Clone, Debug)]
pub enum RoutedOutcome {
    Direct {
        signature: Signature,
    },
    Squads {
        multisig: Address,
        vault: Address,
        transaction_index: u64,
        vault_transaction_pda: Address,
        proposal_pda: Address,
        creation_signature: Signature,
        threshold: u16,
        total_members: usize,
    },
}

impl RoutedOutcome {
    pub fn format_structured(&self) -> String {
        match self {
            Self::Direct { signature } => {
                format!("[Direct] Transaction confirmed.\n  signature: {signature}")
            }
            Self::Squads {
                multisig,
                vault,
                transaction_index,
                vault_transaction_pda,
                proposal_pda,
                creation_signature,
                threshold,
                total_members,
            } => format!(
                "[Squads] Vault transaction created.\n  multisig: {multisig}\n  vault: {vault}\n  transaction_index: {transaction_index}\n  vault_transaction_pda: {vault_transaction_pda}\n  proposal_pda: {proposal_pda}\n  creation_signature: {creation_signature}\n  threshold: {threshold} of {total_members}\n  url: https://app.squads.so/squads/{multisig}/transactions/{transaction_index}"
            ),
        }
    }
}

async fn send(rpc: &RpcClient, ixs: &[Instruction], payer: &Keypair) -> Result<Signature> {
    let blockhash = rpc.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(ixs, Some(&payer.pubkey()), &[payer], blockhash);
    Ok(rpc.send_and_confirm_transaction(&tx).await?)
}

pub async fn route(
    rpc: &RpcClient,
    vault_ixs: Vec<Instruction>,
    preflight_ixs: Vec<Instruction>,
    signers: &[&Keypair],
    squads_config: Option<&SquadsRoutingConfig>,
) -> Result<RoutedOutcome> {
    let payer = signers
        .first()
        .ok_or_else(|| anyhow!("at least one signer is required"))?;
    let Some(config) = squads_config else {
        let mut ixs = preflight_ixs;
        ixs.extend(vault_ixs);
        return Ok(RoutedOutcome::Direct {
            signature: send(rpc, &ixs, payer).await?,
        });
    };

    if !preflight_ixs.is_empty() {
        send(rpc, &preflight_ixs, payer).await?;
    }
    let squads = config
        .program_id
        .map(|id| SquadsClient::with_program_id(to_squads_pubkey(id)))
        .unwrap_or_else(SquadsClient::new);
    let multisig_address = to_squads_pubkey(config.multisig);
    let proposer = to_squads_pubkey(config.proposer);
    let vault_ixs = vault_ixs.into_iter().map(to_squads_ix).collect::<Vec<_>>();

    for attempt in 1..=MAX_INDEX_ATTEMPTS {
        let data = rpc.get_account_data(&config.multisig).await?;
        let multisig = Multisig::try_deserialize(&data).map_err(|e| anyhow!(e.to_string()))?;
        squads
            .verify_proposer(&multisig_address, &multisig, &proposer)
            .map_err(|e| anyhow!(e.to_string()))?;
        let built = squads
            .build_vault_tx_with_proposal(
                &multisig_address,
                multisig.transaction_index,
                config.vault_index,
                &proposer,
                &proposer,
                &vault_ixs,
                &[],
                config.memo.clone(),
            )
            .map_err(|e| anyhow!(e.to_string()))?;
        let ixs = built
            .instructions
            .into_iter()
            .map(from_squads_ix)
            .collect::<Vec<_>>();
        match send(rpc, &ixs, payer).await {
            Ok(creation_signature) => {
                let (vault, _) = squads.pda_vault(&multisig_address, config.vault_index);
                return Ok(RoutedOutcome::Squads {
                    multisig: config.multisig,
                    vault: from_squads_pubkey(vault),
                    transaction_index: built.transaction_index,
                    vault_transaction_pda: from_squads_pubkey(built.transaction),
                    proposal_pda: from_squads_pubkey(built.proposal),
                    creation_signature,
                    threshold: multisig.threshold,
                    total_members: multisig.members.len(),
                });
            }
            Err(err)
                if err.to_string().contains("already in use") && attempt < MAX_INDEX_ATTEMPTS => {}
            Err(err) => return Err(err),
        }
    }
    Err(anyhow!("failed to claim a Squads transaction index"))
}
