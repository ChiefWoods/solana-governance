import {
    combineCodec,
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    type Codec,
    type Decoder,
    type Encoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

/** Inner struct of BallotBox */
export type Ballot = {
    /** The merkle root of the meta merkle tree */
    metaMerkleRoot: ReadonlyUint8Array;
    /** SHA256 hash of borsh serialized snapshot. Optional. */
    snapshotHash: ReadonlyUint8Array;
};

export type BallotArgs = Ballot;

export function getBallotEncoder(): Encoder<BallotArgs> {
    return getStructEncoder([
        ['metaMerkleRoot', fixEncoderSize(getBytesEncoder(), 32)],
        ['snapshotHash', fixEncoderSize(getBytesEncoder(), 32)],
    ]);
}

export function getBallotDecoder(): Decoder<Ballot> {
    return getStructDecoder([
        ['metaMerkleRoot', fixDecoderSize(getBytesDecoder(), 32)],
        ['snapshotHash', fixDecoderSize(getBytesDecoder(), 32)],
    ]);
}

export function getBallotCodec(): Codec<BallotArgs, Ballot> {
    return combineCodec(getBallotEncoder(), getBallotDecoder());
}
