import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getArrayDecoder,
    getBytesDecoder,
    getI64Decoder,
    getOptionDecoder,
    getStructDecoder,
    getU16Decoder,
    transformDecoder,
    type Decoder,
    type Option,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const PROGRAM_CONFIG_ACCOUNT_DISCRIMINATOR = new Uint8Array([196, 210, 90, 231, 144, 149, 140, 63]);

export type ProgramConfigAccountData = {
    /** Authority allowed to update the config. */
    authority: Address;
    /** Authority to be set to upon finalization of proposal. */
    proposedAuthority: Option<Address>;
    /**
     * Operators whitelisted to participate in voting.
     * A snapshot of this list will be taken at the time of BallotBox creation.
     */
    whitelistedOperators: Array<Address>;
    /** Min. percentage of votes required to finalize a ballot. Used during BallotBox creation. */
    minConsensusThresholdBps: number;
    /** Admin allowed to decide the winning ballot if vote expires before consensus. */
    tieBreakerAdmin: Address;
    /** Duration for which ballot box will be opened for voting. */
    voteDuration: bigint;
    /**
     * The svmgov governance program whose Proposal PDAs are authorized to open
     * ballot boxes. Checked in `init_ballot_box`; updatable by the authority so
     * the program can be retargeted at a new svmgov deployment without a redeploy.
     */
    svmgovProgramPubkey: Address;
};

export interface ProgramConfigAccount {
    address: Address;
    data: ProgramConfigAccountData;
}

function getProgramConfigAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** Authority allowed to update the config. */
    authority: Address;
    /** Authority to be set to upon finalization of proposal. */
    proposedAuthority: Option<Address>;
    /**
     * Operators whitelisted to participate in voting.
     * A snapshot of this list will be taken at the time of BallotBox creation.
     */
    whitelistedOperators: Array<Address>;
    /** Min. percentage of votes required to finalize a ballot. Used during BallotBox creation. */
    minConsensusThresholdBps: number;
    /** Admin allowed to decide the winning ballot if vote expires before consensus. */
    tieBreakerAdmin: Address;
    /** Duration for which ballot box will be opened for voting. */
    voteDuration: bigint;
    /**
     * The svmgov governance program whose Proposal PDAs are authorized to open
     * ballot boxes. Checked in `init_ballot_box`; updatable by the authority so
     * the program can be retargeted at a new svmgov deployment without a redeploy.
     */
    svmgovProgramPubkey: Address;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['authority', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        [
            'proposedAuthority',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        [
            'whitelistedOperators',
            getArrayDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['minConsensusThresholdBps', getU16Decoder()],
        ['tieBreakerAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['voteDuration', getI64Decoder()],
        ['svmgovProgramPubkey', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
    ]);
}

export function deserializeProgramConfigAccount(data: Uint8Array): ProgramConfigAccountData {
    if (!PROGRAM_CONFIG_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROGRAMCONFIGACCOUNT discriminator mismatch');
    }
    const deserialized = getProgramConfigAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as ProgramConfigAccountData;
}

export async function fetchProgramConfigAccount(
    connection: Connection,
    address: Address,
): Promise<ProgramConfigAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('ProgramConfig account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeProgramConfigAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeProgramConfigAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(ProgramConfigAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeProgramConfigAccount(accountInfo.data),
        };
    });
}

export async function fetchAllProgramConfigAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<ProgramConfigAccount[]> {
    const maybeAccounts = await fetchAllMaybeProgramConfigAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('ProgramConfig account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is ProgramConfigAccount => a !== null);
}

export async function fetchProgramAccountsProgramConfig(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<ProgramConfigAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'ZvRBuXAH68e' } }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeProgramConfigAccount(account.data),
    }));
}
