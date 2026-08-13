import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getStructDecoder,
    getU32Decoder,
    getU8Decoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const PROPOSAL_INDEX_ACCOUNT_DISCRIMINATOR = new Uint8Array([83, 97, 143, 58, 176, 46, 177, 195]);

export type ProposalIndexAccountData = { currentIndex: number; bump: number };

export interface ProposalIndexAccount {
    address: Address;
    data: ProposalIndexAccountData;
}

function getProposalIndexAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    currentIndex: number;
    bump: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['currentIndex', getU32Decoder()],
        ['bump', getU8Decoder()],
    ]);
}

export function deserializeProposalIndexAccount(data: Uint8Array): ProposalIndexAccountData {
    if (!PROPOSAL_INDEX_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALINDEXACCOUNT discriminator mismatch');
    }
    const deserialized = getProposalIndexAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as ProposalIndexAccountData;
}

export async function fetchProposalIndexAccount(
    connection: Connection,
    address: Address,
): Promise<ProposalIndexAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('ProposalIndex account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeProposalIndexAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeProposalIndexAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(ProposalIndexAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeProposalIndexAccount(accountInfo.data),
        };
    });
}

export async function fetchAllProposalIndexAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<ProposalIndexAccount[]> {
    const maybeAccounts = await fetchAllMaybeProposalIndexAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('ProposalIndex account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is ProposalIndexAccount => a !== null);
}

export async function fetchProgramAccountsProposalIndex(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<ProposalIndexAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'EwuG6DPBM8n' } }, { dataSize: 13 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeProposalIndexAccount(account.data),
    }));
}
