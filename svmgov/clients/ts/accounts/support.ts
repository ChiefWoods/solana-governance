import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getStructDecoder,
    getU8Decoder,
    transformDecoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const SUPPORT_ACCOUNT_DISCRIMINATOR = new Uint8Array([247, 108, 3, 111, 84, 51, 217, 107]);

export type SupportAccountData = { proposal: Address; validator: Address; bump: number };

export interface SupportAccount {
    address: Address;
    data: SupportAccountData;
}

function getSupportAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    proposal: Address;
    validator: Address;
    bump: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['proposal', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['bump', getU8Decoder()],
    ]);
}

export function deserializeSupportAccount(data: Uint8Array): SupportAccountData {
    if (!SUPPORT_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('SUPPORTACCOUNT discriminator mismatch');
    }
    const deserialized = getSupportAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as SupportAccountData;
}

export async function fetchSupportAccount(connection: Connection, address: Address): Promise<SupportAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('Support account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeSupportAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeSupportAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(SupportAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeSupportAccount(accountInfo.data),
        };
    });
}

export async function fetchAllSupportAccounts(connection: Connection, addresses: Address[]): Promise<SupportAccount[]> {
    const maybeAccounts = await fetchAllMaybeSupportAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('Support account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is SupportAccount => a !== null);
}

export async function fetchProgramAccountsSupport(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<SupportAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'iPJZ3b689rA' } }, { dataSize: 73 }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeSupportAccount(account.data),
    }));
}
