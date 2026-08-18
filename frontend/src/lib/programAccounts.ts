import { decodeStakeStateAccount, STAKE_PROGRAM_ADDRESS, type StakeStateAccount } from '@solana-program/stake';
import {
    getAddressEncoder,
    getBase64Decoder,
    parseBase64RpcAccount,
    type Account,
    type Address,
    type Base64EncodedBytes,
    type GetProgramAccountsApi,
    type ReadonlyUint8Array,
    type Rpc,
} from '@solana/kit';
import {
    decodeProposal,
    decodeSupport,
    decodeVote,
    PROPOSAL_DISCRIMINATOR,
    SUPPORT_DISCRIMINATOR,
    SVMGOV_PROGRAM_ADDRESS,
    VOTE_DISCRIMINATOR,
    type Proposal,
    type Support,
    type Vote,
} from '@solana/svmgov';

const SUPPORT_PROPOSAL_OFFSET = 8n;
const VOTE_PROPOSAL_OFFSET = 40n;
const STAKE_ACCOUNT_SIZE = 200n;
/** StakeStateV2 enum (4) + rentExemptReserve (8). */
const AUTHORIZED_STAKER_OFFSET = 12n;
/** Authorized staker (32) after the staker pubkey. */
const AUTHORIZED_WITHDRAWER_OFFSET = 44n;

function toBase64Bytes(bytes: ReadonlyUint8Array): Base64EncodedBytes {
    return getBase64Decoder().decode(bytes) as Base64EncodedBytes;
}

const PROPOSAL_DISCRIMINATOR_BASE64 = toBase64Bytes(PROPOSAL_DISCRIMINATOR);
const SUPPORT_DISCRIMINATOR_BASE64 = toBase64Bytes(SUPPORT_DISCRIMINATOR);
const VOTE_DISCRIMINATOR_BASE64 = toBase64Bytes(VOTE_DISCRIMINATOR);

function memcmp(offset: bigint, bytes: Base64EncodedBytes) {
    return {
        memcmp: {
            bytes,
            encoding: 'base64' as const,
            offset,
        },
    };
}

export async function fetchAllProposals(rpc: Rpc<GetProgramAccountsApi>): Promise<Account<Proposal>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [memcmp(0n, PROPOSAL_DISCRIMINATOR_BASE64)],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeProposal(parseBase64RpcAccount(pubkey, account)));
}

export async function fetchProposalSupports(
    rpc: Rpc<GetProgramAccountsApi>,
    proposalAddress: Address,
): Promise<Account<Support>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                memcmp(0n, SUPPORT_DISCRIMINATOR_BASE64),
                memcmp(SUPPORT_PROPOSAL_OFFSET, toBase64Bytes(getAddressEncoder().encode(proposalAddress))),
            ],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeSupport(parseBase64RpcAccount(pubkey, account)));
}

export async function fetchProposalVotes(
    rpc: Rpc<GetProgramAccountsApi>,
    proposalAddress: Address,
): Promise<Account<Vote>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                memcmp(0n, VOTE_DISCRIMINATOR_BASE64),
                memcmp(VOTE_PROPOSAL_OFFSET, toBase64Bytes(getAddressEncoder().encode(proposalAddress))),
            ],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeVote(parseBase64RpcAccount(pubkey, account)));
}

/**
 * Flattened `StakeStateV2` fields for wallet stake lists.
 * 
 * Codama's decoded account is a discriminated union (`Initialized` / `Stake` / …);
 * this type exposes address, authorities, voter, and active stake without `__kind` / `fields` branching.
 */
export type WalletStakeAccount = {
    activeStakeLamports: bigint;
    address: Address;
    staker: Address;
    state: 'delegated' | 'initialized';
    voter: Address | null;
    withdrawer: Address;
};

function stakeAuthorityBytes(owner: Address): Base64EncodedBytes {
    return toBase64Bytes(getAddressEncoder().encode(owner));
}

async function fetchStakeAccountsByAuthority(
    rpc: Rpc<GetProgramAccountsApi>,
    owner: Address,
    offset: bigint,
): Promise<Account<StakeStateAccount>[]> {
    const accounts = await rpc
        .getProgramAccounts(STAKE_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [{ dataSize: STAKE_ACCOUNT_SIZE }, memcmp(offset, stakeAuthorityBytes(owner))],
        })
        .send();

    return accounts.flatMap(({ account, pubkey }) => {
        try {
            return [decodeStakeStateAccount(parseBase64RpcAccount(pubkey, account))];
        } catch {
            return [];
        }
    });
}

/**
 * Maps a decoded stake account into {@link WalletStakeAccount}.
 * Returns `null` for `Uninitialized` and `RewardsPool` variants, which cannot vote.
 */
export function toWalletStakeAccount(account: Account<StakeStateAccount>): WalletStakeAccount | null {
    const { state } = account.data;
    if (state.__kind !== 'Initialized' && state.__kind !== 'Stake') return null;

    const meta = state.fields[0];
    const delegation = state.__kind === 'Stake' ? state.fields[1].delegation : null;

    return {
        activeStakeLamports: delegation?.stake ?? 0n,
        address: account.address,
        staker: meta.authorized.staker,
        state: state.__kind === 'Stake' ? 'delegated' : 'initialized',
        voter: delegation?.voterPubkey ?? null,
        withdrawer: meta.authorized.withdrawer,
    };
}

/**
 * Stake accounts where `owner` is the authorized staker or withdrawer.
 * Those roles can be different wallets, and `getProgramAccounts` can only `memcmp`
 * one offset per request, so both are queried and merged.
 */
export async function fetchStakeAccounts(
    rpc: Rpc<GetProgramAccountsApi>,
    owner: Address,
): Promise<WalletStakeAccount[]> {
    const [byStaker, byWithdrawer] = await Promise.all([
        fetchStakeAccountsByAuthority(rpc, owner, AUTHORIZED_STAKER_OFFSET),
        fetchStakeAccountsByAuthority(rpc, owner, AUTHORIZED_WITHDRAWER_OFFSET),
    ]);

    const byAddress = new Map<string, WalletStakeAccount>();
    for (const account of [...byStaker, ...byWithdrawer]) {
        const mapped = toWalletStakeAccount(account);
        // dedups by address
        if (mapped) byAddress.set(mapped.address, mapped);
    }

    return [...byAddress.values()];
}
