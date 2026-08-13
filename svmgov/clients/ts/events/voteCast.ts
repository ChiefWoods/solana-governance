import { Address } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getI64Decoder,
    getStructDecoder,
    getU64Decoder,
    transformDecoder,
} from '@solana/codecs';

export const VOTE_CAST_DISCRIMINATOR = new Uint8Array([39, 53, 195, 104, 188, 17, 225, 213]);

export function getVoteCastDiscriminatorBytes(): Uint8Array {
    return VOTE_CAST_DISCRIMINATOR;
}

export type VoteCast = {
    proposalId: Address;
    voter: Address;
    voteAccount: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    voteTimestamp: bigint;
};

function getVoteCastDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['voter', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['voteAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['forVotesBp', getU64Decoder()],
            ['againstVotesBp', getU64Decoder()],
            ['abstainVotesBp', getU64Decoder()],
            ['forVotesLamports', getU64Decoder()],
            ['againstVotesLamports', getU64Decoder()],
            ['abstainVotesLamports', getU64Decoder()],
            ['voteTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(VOTE_CAST_DISCRIMINATOR)],
    );
}

export function parseVoteCast(data: Uint8Array): VoteCast {
    if (!VOTE_CAST_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTECAST discriminator mismatch');
    }
    const decoded = getVoteCastDecoder().decode(data);
    return decoded as VoteCast;
}
