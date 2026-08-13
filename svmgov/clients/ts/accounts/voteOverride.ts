import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getI64Decoder,
    getStructDecoder,
    getU64Decoder,
    getU8Decoder,
    transformDecoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const VOTE_OVERRIDE_ACCOUNT_DISCRIMINATOR = new Uint8Array([130, 93, 172, 50, 168, 151, 176, 188]);

export type VoteOverrideAccountData = {
    delegator: Address;
    stakeAccount: Address;
    validator: Address;
    proposal: Address;
    voteAccountValidator: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stakeAmount: bigint;
    voteOverrideTimestamp: bigint;
    bump: number;
};

export interface VoteOverrideAccount {
    address: Address;
    data: VoteOverrideAccountData;
}

function getVoteOverrideAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    delegator: Address;
    stakeAccount: Address;
    validator: Address;
    proposal: Address;
    voteAccountValidator: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stakeAmount: bigint;
    voteOverrideTimestamp: bigint;
    bump: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['delegator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['stakeAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['proposal', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['voteAccountValidator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
        ['forVotesLamports', getU64Decoder()],
        ['againstVotesLamports', getU64Decoder()],
        ['abstainVotesLamports', getU64Decoder()],
        ['stakeAmount', getU64Decoder()],
        ['voteOverrideTimestamp', getI64Decoder()],
        ['bump', getU8Decoder()],
    ]);
}

export function deserializeVoteOverrideAccount(data: Uint8Array): VoteOverrideAccountData {
    if (!VOTE_OVERRIDE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEOVERRIDEACCOUNT discriminator mismatch');
    }
    const deserialized = getVoteOverrideAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as VoteOverrideAccountData;
}

export async function fetchVoteOverrideAccount(connection: Connection, address: Address): Promise<VoteOverrideAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('VoteOverride account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeVoteOverrideAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeVoteOverrideAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(VoteOverrideAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeVoteOverrideAccount(accountInfo.data),
        };
    });
}

export async function fetchAllVoteOverrideAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<VoteOverrideAccount[]> {
    const maybeAccounts = await fetchAllMaybeVoteOverrideAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('VoteOverride account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is VoteOverrideAccount => a !== null);
}

export async function fetchProgramAccountsVoteOverride(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<VoteOverrideAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'NoiLFMSoFVm' } }, { dataSize: 233 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeVoteOverrideAccount(account.data),
    }));
}
