import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    addDecoderSizePrefix,
    fixDecoderSize,
    getBooleanDecoder,
    getBytesDecoder,
    getI64Decoder,
    getOptionDecoder,
    getStructDecoder,
    getU32Decoder,
    getU64Decoder,
    getU8Decoder,
    getUtf8Decoder,
    transformDecoder,
    type Decoder,
    type Option,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export const PROPOSAL_ACCOUNT_DISCRIMINATOR = new Uint8Array([26, 94, 189, 187, 116, 136, 53, 33]);

export type ProposalAccountData = {
    /** The public key of the validator who created this proposal */
    author: Address;
    title: string;
    description: string;
    creationEpoch: bigint;
    startEpoch: bigint;
    endEpoch: bigint;
    proposerStakeWeightBp: bigint;
    clusterSupportLamports: bigint;
    /** Total lamports voted in favor of this proposal */
    forVotesLamports: bigint;
    /** Total lamports voted against this proposal */
    againstVotesLamports: bigint;
    /** Total lamports that abstained from voting on this proposal */
    abstainVotesLamports: bigint;
    voting: boolean;
    finalized: boolean;
    proposalBump: number;
    creationTimestamp: bigint;
    voteCount: number;
    index: number;
    consensusResult: Option<Address>;
    /** Slot number when the validator stake snapshot was taken */
    snapshotSlot: bigint;
    proposalSeed: bigint;
    voteAccountPubkey: Address;
    /**
     * Number of supporter entries stored in the account data at the fixed
     * offset [`Proposal::SUPPORTERS_OFFSET`].
     *
     * The supporter vote-account pubkeys are intentionally NOT a field of
     * this struct: they live past the struct's Borsh capacity boundary
     * (`discriminator + INIT_SPACE`), so Anchor only (de)serializes this
     * 4-byte count. The entries are read zero-copy via
     * [`Proposal::supporters`] and written by [`Proposal::append_supporter`].
     */
    numSupporters: number;
};

export interface ProposalAccount {
    address: Address;
    data: ProposalAccountData;
}

function getProposalAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** The public key of the validator who created this proposal */
    author: Address;
    title: string;
    description: string;
    creationEpoch: bigint;
    startEpoch: bigint;
    endEpoch: bigint;
    proposerStakeWeightBp: bigint;
    clusterSupportLamports: bigint;
    /** Total lamports voted in favor of this proposal */
    forVotesLamports: bigint;
    /** Total lamports voted against this proposal */
    againstVotesLamports: bigint;
    /** Total lamports that abstained from voting on this proposal */
    abstainVotesLamports: bigint;
    voting: boolean;
    finalized: boolean;
    proposalBump: number;
    creationTimestamp: bigint;
    voteCount: number;
    index: number;
    consensusResult: Option<Address>;
    /** Slot number when the validator stake snapshot was taken */
    snapshotSlot: bigint;
    proposalSeed: bigint;
    voteAccountPubkey: Address;
    /**
     * Number of supporter entries stored in the account data at the fixed
     * offset [`Proposal::SUPPORTERS_OFFSET`].
     *
     * The supporter vote-account pubkeys are intentionally NOT a field of
     * this struct: they live past the struct's Borsh capacity boundary
     * (`discriminator + INIT_SPACE`), so Anchor only (de)serializes this
     * 4-byte count. The entries are read zero-copy via
     * [`Proposal::supporters`] and written by [`Proposal::append_supporter`].
     */
    numSupporters: number;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['author', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['title', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ['description', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ['creationEpoch', getU64Decoder()],
        ['startEpoch', getU64Decoder()],
        ['endEpoch', getU64Decoder()],
        ['proposerStakeWeightBp', getU64Decoder()],
        ['clusterSupportLamports', getU64Decoder()],
        ['forVotesLamports', getU64Decoder()],
        ['againstVotesLamports', getU64Decoder()],
        ['abstainVotesLamports', getU64Decoder()],
        ['voting', getBooleanDecoder()],
        ['finalized', getBooleanDecoder()],
        ['proposalBump', getU8Decoder()],
        ['creationTimestamp', getI64Decoder()],
        ['voteCount', getU32Decoder()],
        ['index', getU32Decoder()],
        [
            'consensusResult',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['snapshotSlot', getU64Decoder()],
        ['proposalSeed', getU64Decoder()],
        ['voteAccountPubkey', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['numSupporters', getU32Decoder()],
    ]);
}

export function deserializeProposalAccount(data: Uint8Array): ProposalAccountData {
    if (!PROPOSAL_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALACCOUNT discriminator mismatch');
    }
    const deserialized = getProposalAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as ProposalAccountData;
}

export async function fetchProposalAccount(connection: Connection, address: Address): Promise<ProposalAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('Proposal account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeProposalAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeProposalAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(ProposalAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeProposalAccount(accountInfo.data),
        };
    });
}

export async function fetchAllProposalAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<ProposalAccount[]> {
    const maybeAccounts = await fetchAllMaybeProposalAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('Proposal account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is ProposalAccount => a !== null);
}

export async function fetchProgramAccountsProposal(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<ProposalAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: '5Qpj1hsHT4k' } }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeProposalAccount(account.data),
    }));
}
