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

export const VOTE_ACCOUNT_DISCRIMINATOR = new Uint8Array([96, 91, 104, 57, 145, 35, 172, 155]);

export type VoteAccountData = {
    validator: Address;
    proposal: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stake: bigint;
    overrideLamports: bigint;
    voteTimestamp: bigint;
    bump: number;
};

export interface VoteAccount {
    address: Address;
    data: VoteAccountData;
}

function getVoteAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    validator: Address;
    proposal: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stake: bigint;
    overrideLamports: bigint;
    voteTimestamp: bigint;
    bump: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['proposal', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
        ['forVotesLamports', getU64Decoder()],
        ['againstVotesLamports', getU64Decoder()],
        ['abstainVotesLamports', getU64Decoder()],
        ['stake', getU64Decoder()],
        ['overrideLamports', getU64Decoder()],
        ['voteTimestamp', getI64Decoder()],
        ['bump', getU8Decoder()],
    ]);
}

export function deserializeVoteAccount(data: Uint8Array): VoteAccountData {
    if (!VOTE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEACCOUNT discriminator mismatch');
    }
    const deserialized = getVoteAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as VoteAccountData;
}

export async function fetchVoteAccount(connection: Connection, address: Address): Promise<VoteAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('Vote account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeVoteAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeVoteAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(VoteAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeVoteAccount(accountInfo.data),
        };
    });
}

export async function fetchAllVoteAccounts(connection: Connection, addresses: Address[]): Promise<VoteAccount[]> {
    const maybeAccounts = await fetchAllMaybeVoteAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('Vote account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is VoteAccount => a !== null);
}

export async function fetchProgramAccountsVote(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<VoteAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'H7nUxx34RXx' } }, { dataSize: 145 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeVoteAccount(account.data),
    }));
}
