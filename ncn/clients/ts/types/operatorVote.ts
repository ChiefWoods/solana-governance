import { Address } from '@solana/web3.js';
import {
    combineCodec,
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    getU8Decoder,
    getU8Encoder,
    transformDecoder,
    transformEncoder,
    type Codec,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

/** Inner struct of BallotBox */
export type OperatorVote = {
    /** The operator that cast the vote */
    operator: Address;
    /** The slot the operator voted */
    slotVoted: bigint;
    /** The index of the ballot in the ballot_tallies */
    ballotIndex: number;
};

export type OperatorVoteArgs = {
    /** The operator that cast the vote */
    operator: Address;
    /** The slot the operator voted */
    slotVoted: number | bigint;
    /** The index of the ballot in the ballot_tallies */
    ballotIndex: number;
};

export function getOperatorVoteEncoder(): Encoder<OperatorVoteArgs> {
    return getStructEncoder([
        ['operator', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
        ['slotVoted', getU64Encoder()],
        ['ballotIndex', getU8Encoder()],
    ]);
}

export function getOperatorVoteDecoder(): Decoder<OperatorVote> {
    return getStructDecoder([
        ['operator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['slotVoted', getU64Decoder()],
        ['ballotIndex', getU8Decoder()],
    ]);
}

export function getOperatorVoteCodec(): Codec<OperatorVoteArgs, OperatorVote> {
    return combineCodec(getOperatorVoteEncoder(), getOperatorVoteDecoder());
}
