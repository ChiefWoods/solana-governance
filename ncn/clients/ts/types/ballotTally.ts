import {
    combineCodec,
    getStructDecoder,
    getStructEncoder,
    getU8Decoder,
    getU8Encoder,
    type Codec,
    type Decoder,
    type Encoder,
} from '@solana/codecs';
import { getBallotDecoder, getBallotEncoder, type Ballot, type BallotArgs } from '../types/ballot';

/** Inner struct of BallotBox */
export type BallotTally = {
    /** Index of the tally within the ballot_tallies */
    index: number;
    /** The ballot being tallied */
    ballot: Ballot;
    /** The number of votes for this ballot. Each vote is equally weighted. */
    tally: number;
};

export type BallotTallyArgs = {
    /** Index of the tally within the ballot_tallies */
    index: number;
    /** The ballot being tallied */
    ballot: BallotArgs;
    /** The number of votes for this ballot. Each vote is equally weighted. */
    tally: number;
};

export function getBallotTallyEncoder(): Encoder<BallotTallyArgs> {
    return getStructEncoder([
        ['index', getU8Encoder()],
        ['ballot', getBallotEncoder()],
        ['tally', getU8Encoder()],
    ]);
}

export function getBallotTallyDecoder(): Decoder<BallotTally> {
    return getStructDecoder([
        ['index', getU8Decoder()],
        ['ballot', getBallotDecoder()],
        ['tally', getU8Decoder()],
    ]);
}

export function getBallotTallyCodec(): Codec<BallotTallyArgs, BallotTally> {
    return combineCodec(getBallotTallyEncoder(), getBallotTallyDecoder());
}
