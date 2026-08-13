import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getI64Decoder,
    getOptionDecoder,
    getStructDecoder,
    getU16Decoder,
    getU32Decoder,
    getU64Decoder,
    getU8Decoder,
    transformDecoder,
    type Decoder,
    type Option,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const GLOBAL_CONFIG_ACCOUNT_DISCRIMINATOR = new Uint8Array([149, 8, 156, 202, 160, 252, 176, 217]);

export type GlobalConfigAccountData = {
    /** The admin pubkey who can update this config */
    admin: Address;
    /**
     * A pending admin nominated by the current admin. The transfer only completes
     * once this key signs `accept_admin`. `None` when no transfer is in progress.
     */
    pendingAdmin: Option<Address>;
    /** Maximum length for proposal titles */
    maxTitleLength: number;
    /** Maximum length for proposal descriptions */
    maxDescriptionLength: number;
    /** Maximum epochs allowed for support phase (0 means same epoch as creation) */
    maxSupportEpochs: bigint;
    /** Minimum stake in lamports required to create a proposal */
    minProposalStakeLamports: bigint;
    /**
     * Minimum cluster support percentage in BASIS POINTS (1 bp = 0.01%)
     * e.g., 1000 = 10%, 50 = 0.5%
     */
    clusterSupportPctMinBps: bigint;
    /** Number of full epochs reserved for discussion */
    discussionEpochs: bigint;
    /** Number of epochs for voting period */
    votingEpochs: bigint;
    /** Epochs of extension for snapshot */
    snapshotEpochExtension: bigint;
    /** Slot offset from epoch start for snapshot computation (can be negative) */
    snapshotSlotOffset: bigint;
    /** PDA bump seed */
    bump: number;
    /**
     * Maximum number of validators that may support a single proposal. Bounds
     * the per-transaction cost of re-tallying the `supporters` list so a
     * proposal can always be processed within Solana's heap/compute limits.
     * Must be in `1..=MAX_SUPPORTERS_LIMIT`.
     */
    maxSupporters: number;
};

export interface GlobalConfigAccount {
    address: Address;
    data: GlobalConfigAccountData;
}

function getGlobalConfigAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** The admin pubkey who can update this config */
    admin: Address;
    /**
     * A pending admin nominated by the current admin. The transfer only completes
     * once this key signs `accept_admin`. `None` when no transfer is in progress.
     */
    pendingAdmin: Option<Address>;
    /** Maximum length for proposal titles */
    maxTitleLength: number;
    /** Maximum length for proposal descriptions */
    maxDescriptionLength: number;
    /** Maximum epochs allowed for support phase (0 means same epoch as creation) */
    maxSupportEpochs: bigint;
    /** Minimum stake in lamports required to create a proposal */
    minProposalStakeLamports: bigint;
    /**
     * Minimum cluster support percentage in BASIS POINTS (1 bp = 0.01%)
     * e.g., 1000 = 10%, 50 = 0.5%
     */
    clusterSupportPctMinBps: bigint;
    /** Number of full epochs reserved for discussion */
    discussionEpochs: bigint;
    /** Number of epochs for voting period */
    votingEpochs: bigint;
    /** Epochs of extension for snapshot */
    snapshotEpochExtension: bigint;
    /** Slot offset from epoch start for snapshot computation (can be negative) */
    snapshotSlotOffset: bigint;
    /** PDA bump seed */
    bump: number;
    /**
     * Maximum number of validators that may support a single proposal. Bounds
     * the per-transaction cost of re-tallying the `supporters` list so a
     * proposal can always be processed within Solana's heap/compute limits.
     * Must be in `1..=MAX_SUPPORTERS_LIMIT`.
     */
    maxSupporters: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['admin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        [
            'pendingAdmin',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['maxTitleLength', getU16Decoder()],
        ['maxDescriptionLength', getU16Decoder()],
        ['maxSupportEpochs', getU64Decoder()],
        ['minProposalStakeLamports', getU64Decoder()],
        ['clusterSupportPctMinBps', getU64Decoder()],
        ['discussionEpochs', getU64Decoder()],
        ['votingEpochs', getU64Decoder()],
        ['snapshotEpochExtension', getU64Decoder()],
        ['snapshotSlotOffset', getI64Decoder()],
        ['bump', getU8Decoder()],
        ['maxSupporters', getU32Decoder()],
    ]);
}

export function deserializeGlobalConfigAccount(data: Uint8Array): GlobalConfigAccountData {
    if (!GLOBAL_CONFIG_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('GLOBALCONFIGACCOUNT discriminator mismatch');
    }
    const deserialized = getGlobalConfigAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as GlobalConfigAccountData;
}

export async function fetchGlobalConfigAccount(connection: Connection, address: Address): Promise<GlobalConfigAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('GlobalConfig account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeGlobalConfigAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeGlobalConfigAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(GlobalConfigAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeGlobalConfigAccount(accountInfo.data),
        };
    });
}

export async function fetchAllGlobalConfigAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<GlobalConfigAccount[]> {
    const maybeAccounts = await fetchAllMaybeGlobalConfigAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('GlobalConfig account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is GlobalConfigAccount => a !== null);
}

export async function fetchProgramAccountsGlobalConfig(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<GlobalConfigAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'Rvp9zjtEEBA' } }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeGlobalConfigAccount(account.data),
    }));
}
