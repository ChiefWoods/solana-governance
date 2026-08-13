import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getStructDecoder,
    getU64Decoder,
    getU8Decoder,
    transformDecoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const VOTE_OVERRIDE_CACHE_ACCOUNT_DISCRIMINATOR = new Uint8Array([195, 82, 50, 219, 140, 34, 108, 57]);

export type VoteOverrideCacheAccountData = {
    validator: Address;
    proposal: Address;
    voteAccountValidator: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    totalStake: bigint;
    bump: number;
};

export interface VoteOverrideCacheAccount {
    address: Address;
    data: VoteOverrideCacheAccountData;
}

function getVoteOverrideCacheAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    validator: Address;
    proposal: Address;
    voteAccountValidator: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    totalStake: bigint;
    bump: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['proposal', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['voteAccountValidator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
        ['forVotesLamports', getU64Decoder()],
        ['againstVotesLamports', getU64Decoder()],
        ['abstainVotesLamports', getU64Decoder()],
        ['totalStake', getU64Decoder()],
        ['bump', getU8Decoder()],
    ]);
}

export function deserializeVoteOverrideCacheAccount(data: Uint8Array): VoteOverrideCacheAccountData {
    if (!VOTE_OVERRIDE_CACHE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEOVERRIDECACHEACCOUNT discriminator mismatch');
    }
    const deserialized = getVoteOverrideCacheAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as VoteOverrideCacheAccountData;
}

export async function fetchVoteOverrideCacheAccount(
    connection: Connection,
    address: Address,
): Promise<VoteOverrideCacheAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('VoteOverrideCache account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeVoteOverrideCacheAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeVoteOverrideCacheAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(VoteOverrideCacheAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeVoteOverrideCacheAccount(accountInfo.data),
        };
    });
}

export async function fetchAllVoteOverrideCacheAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<VoteOverrideCacheAccount[]> {
    const maybeAccounts = await fetchAllMaybeVoteOverrideCacheAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('VoteOverrideCache account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is VoteOverrideCacheAccount => a !== null);
}

export async function fetchProgramAccountsVoteOverrideCache(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<VoteOverrideCacheAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'ZfrqSfLxvTS' } }, { dataSize: 161 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeVoteOverrideCacheAccount(account.data),
    }));
}
