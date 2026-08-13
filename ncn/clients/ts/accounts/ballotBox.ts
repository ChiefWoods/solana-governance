import { Address, Connection, GetProgramAccountsFilter } from '@solana/web3.js';
import {
    fixDecoderSize,
    getArrayDecoder,
    getBooleanDecoder,
    getBytesDecoder,
    getI64Decoder,
    getStructDecoder,
    getU16Decoder,
    getU64Decoder,
    getU8Decoder,
    transformDecoder,
    type Decoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import { getBallotDecoder, type Ballot } from '../types/ballot';
import { getBallotTallyDecoder, type BallotTally } from '../types/ballotTally';
import { getOperatorVoteDecoder, type OperatorVote } from '../types/operatorVote';

export const BALLOT_BOX_ACCOUNT_DISCRIMINATOR = new Uint8Array([155, 169, 156, 8, 92, 14, 24, 101]);

export type BallotBoxAccountData = {
    /** Bump seed for the PDA */
    bump: number;
    /** The epoch this ballot box is for */
    epoch: bigint;
    /** Slot when this ballot box was created */
    slotCreated: bigint;
    /** Slot when consensus was reached */
    slotConsensusReached: bigint;
    /** Min. percentage of votes required to finalize for this ballot box. */
    minConsensusThresholdBps: number;
    /** The ballot that got at least min_consensus_threshold of votes */
    winningBallot: Ballot;
    /** Operator votes */
    operatorVotes: Array<OperatorVote>;
    /**
     * Vote counts per distinct ballot. Each whitelisted operator contributes
     * one vote; tallies are not stake-weighted.
     */
    ballotTallies: Array<BallotTally>;
    /**
     * Timestamp when voting ends. Tie breaker admin will decide the results
     * if no consensus is reached by then.
     */
    voteExpiryTimestamp: bigint;
    /** Slot for which the snapshot is taken */
    snapshotSlot: bigint;
    /** Snapshot of whitelisted operators at BallotBox creation */
    voterList: Array<Address>;
    /** Whether consensus was reached via tie breaker */
    tieBreakerConsensus: boolean;
};

export interface BallotBoxAccount {
    address: Address;
    data: BallotBoxAccountData;
}

function getBallotBoxAccountDataDecoder(): Decoder<{
    discriminator: ReadonlyUint8Array;
    /** Bump seed for the PDA */
    bump: number;
    /** The epoch this ballot box is for */
    epoch: bigint;
    /** Slot when this ballot box was created */
    slotCreated: bigint;
    /** Slot when consensus was reached */
    slotConsensusReached: bigint;
    /** Min. percentage of votes required to finalize for this ballot box. */
    minConsensusThresholdBps: number;
    /** The ballot that got at least min_consensus_threshold of votes */
    winningBallot: Ballot;
    /** Operator votes */
    operatorVotes: Array<OperatorVote>;
    /**
     * Vote counts per distinct ballot. Each whitelisted operator contributes
     * one vote; tallies are not stake-weighted.
     */
    ballotTallies: Array<BallotTally>;
    /**
     * Timestamp when voting ends. Tie breaker admin will decide the results
     * if no consensus is reached by then.
     */
    voteExpiryTimestamp: bigint;
    /** Slot for which the snapshot is taken */
    snapshotSlot: bigint;
    /** Snapshot of whitelisted operators at BallotBox creation */
    voterList: Array<Address>;
    /** Whether consensus was reached via tie breaker */
    tieBreakerConsensus: boolean;
}> {
    return getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['bump', getU8Decoder()],
        ['epoch', getU64Decoder()],
        ['slotCreated', getU64Decoder()],
        ['slotConsensusReached', getU64Decoder()],
        ['minConsensusThresholdBps', getU16Decoder()],
        ['winningBallot', getBallotDecoder()],
        ['operatorVotes', getArrayDecoder(getOperatorVoteDecoder())],
        ['ballotTallies', getArrayDecoder(getBallotTallyDecoder())],
        ['voteExpiryTimestamp', getI64Decoder()],
        ['snapshotSlot', getU64Decoder()],
        [
            'voterList',
            getArrayDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['tieBreakerConsensus', getBooleanDecoder()],
    ]);
}

export function deserializeBallotBoxAccount(data: Uint8Array): BallotBoxAccountData {
    if (!BALLOT_BOX_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('BALLOTBOXACCOUNT discriminator mismatch');
    }
    const deserialized = getBallotBoxAccountDataDecoder().decode(data);
    const { discriminator: _, ...accountData } = deserialized;
    return accountData as BallotBoxAccountData;
}

export async function fetchBallotBoxAccount(connection: Connection, address: Address): Promise<BallotBoxAccount> {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('BallotBox account not found at address: ' + address.toBase58());
    }
    return {
        address,
        data: deserializeBallotBoxAccount(accountInfo.data),
    };
}

export async function fetchAllMaybeBallotBoxAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<(BallotBoxAccount | null)[]> {
    const accountInfos = await connection.getMultipleAccountsInfo(addresses);
    return accountInfos.map((accountInfo, index) => {
        if (!accountInfo) {
            return null;
        }
        return {
            address: addresses[index],
            data: deserializeBallotBoxAccount(accountInfo.data),
        };
    });
}

export async function fetchAllBallotBoxAccounts(
    connection: Connection,
    addresses: Address[],
): Promise<BallotBoxAccount[]> {
    const maybeAccounts = await fetchAllMaybeBallotBoxAccounts(connection, addresses);
    const missingAddresses = maybeAccounts
        .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
        .join(', ');
    if (missingAddresses) {
        throw new Error('BallotBox account(s) not found at address(es): ' + missingAddresses);
    }
    return maybeAccounts.filter((a): a is BallotBoxAccount => a !== null);
}

export async function fetchProgramAccountsBallotBox(
    connection: Connection,
    programId: Address,
    options?: {
        commitment?: 'processed' | 'confirmed' | 'finalized';
        filters?: GetProgramAccountsFilter[];
    },
): Promise<BallotBoxAccount[]> {
    const accounts = await connection.getProgramAccounts(programId, {
        commitment: options?.commitment,
        filters: [...[{ memcmp: { offset: 0, bytes: 'T3844not6RA' } }], ...(options?.filters ?? [])],
    });
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: deserializeBallotBoxAccount(account.data),
    }));
}
