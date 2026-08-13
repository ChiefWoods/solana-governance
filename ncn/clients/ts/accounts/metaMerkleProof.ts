import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getArrayDecoder,
    getBytesDecoder,
    getI64Decoder,
    getStructDecoder,
    transformDecoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import { getMetaMerkleLeafDecoder, type MetaMerkleLeaf } from '../types/metaMerkleLeaf';

export const META_MERKLE_PROOF_ACCOUNT_DISCRIMINATOR = new Uint8Array([130, 55, 141, 26, 195, 58, 18, 178]);

export type MetaMerkleProofAccountData = {
    /** Payer wallet */
    payer: Address;
    /** ConsensusResult proof is created for. */
    consensusResult: Address;
    /** Meta merkle leaf */
    metaMerkleLeaf: MetaMerkleLeaf;
    /** Meta merkle proof */
    metaMerkleProof: Array<ReadonlyUint8Array>;
    /**
     * Timestamp after which MetaMerkleProof can be closed permissionlessly.
     * This is selected by the payer but our recommendation is to set to vote expiry time.
     */
    closeTimestamp: bigint;
};

export interface MetaMerkleProofAccount {
    address: Address;
    data: MetaMerkleProofAccountData;
}

function getMetaMerkleProofAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** Payer wallet */
    payer: Address;
    /** ConsensusResult proof is created for. */
    consensusResult: Address;
    /** Meta merkle leaf */
    metaMerkleLeaf: MetaMerkleLeaf;
    /** Meta merkle proof */
    metaMerkleProof: Array<ReadonlyUint8Array>;
    /**
     * Timestamp after which MetaMerkleProof can be closed permissionlessly.
     * This is selected by the payer but our recommendation is to set to vote expiry time.
     */
    closeTimestamp: bigint;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['payer', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['consensusResult', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['metaMerkleLeaf', getMetaMerkleLeafDecoder()],
        ['metaMerkleProof', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 32))],
        ['closeTimestamp', getI64Decoder()],
    ]);
}

export function deserializeMetaMerkleProofAccount(data: Uint8Array): MetaMerkleProofAccountData {
    if (!META_MERKLE_PROOF_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('METAMERKLEPROOFACCOUNT discriminator mismatch');
    }
    const deserialized = getMetaMerkleProofAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as MetaMerkleProofAccountData;
}

export async function fetchMetaMerkleProofAccount(
    connection: Connection,
    address: Address,
): Promise<MetaMerkleProofAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('MetaMerkleProof account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeMetaMerkleProofAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeMetaMerkleProofAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(MetaMerkleProofAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeMetaMerkleProofAccount(accountInfo.data),
        };
    });
}

export async function fetchAllMetaMerkleProofAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<MetaMerkleProofAccount[]> {
    const maybeAccounts = await fetchAllMaybeMetaMerkleProofAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('MetaMerkleProof account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is MetaMerkleProofAccount => a !== null);
}

export async function fetchProgramAccountsMetaMerkleProof(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<MetaMerkleProofAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'NnGYWETjUg1' } }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeMetaMerkleProofAccount(account.data),
    }));
}
