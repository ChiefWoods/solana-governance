import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBooleanDecoder,
    getBytesDecoder,
    getStructDecoder,
    getU64Decoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import { getBallotDecoder, type Ballot } from '../types/ballot';

export const CONSENSUS_RESULT_ACCOUNT_DISCRIMINATOR = new Uint8Array([105, 121, 122, 243, 100, 58, 93, 161]);

export type ConsensusResultAccountData = {
    /** Snapshot slot used for the ballot box */
    snapshotSlot: bigint;
    /** Ballot */
    ballot: Ballot;
    /** Whether consensus was reached via tie breaker */
    tieBreakerConsensus: boolean;
};

export interface ConsensusResultAccount {
    address: Address;
    data: ConsensusResultAccountData;
}

function getConsensusResultAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** Snapshot slot used for the ballot box */
    snapshotSlot: bigint;
    /** Ballot */
    ballot: Ballot;
    /** Whether consensus was reached via tie breaker */
    tieBreakerConsensus: boolean;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['snapshotSlot', getU64Decoder()],
        ['ballot', getBallotDecoder()],
        ['tieBreakerConsensus', getBooleanDecoder()],
    ]);
}

export function deserializeConsensusResultAccount(data: Uint8Array): ConsensusResultAccountData {
    if (!CONSENSUS_RESULT_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('CONSENSUSRESULTACCOUNT discriminator mismatch');
    }
    const deserialized = getConsensusResultAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as ConsensusResultAccountData;
}

export async function fetchConsensusResultAccount(
    connection: Connection,
    address: Address,
): Promise<ConsensusResultAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('ConsensusResult account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeConsensusResultAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeConsensusResultAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(ConsensusResultAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeConsensusResultAccount(accountInfo.data),
        };
    });
}

export async function fetchAllConsensusResultAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<ConsensusResultAccount[]> {
    const maybeAccounts = await fetchAllMaybeConsensusResultAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('ConsensusResult account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is ConsensusResultAccount => a !== null);
}

export async function fetchProgramAccountsConsensusResult(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<ConsensusResultAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'JeEdqAtxoyJ' } }, { dataSize: 81 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeConsensusResultAccount(account.data),
    }));
}
