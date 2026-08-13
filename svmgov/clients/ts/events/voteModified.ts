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

export const VOTE_MODIFIED_DISCRIMINATOR = new Uint8Array([192, 64, 130, 9, 210, 47, 57, 175]);

export function getVoteModifiedDiscriminatorBytes(): Uint8Array {
    return VOTE_MODIFIED_DISCRIMINATOR;
}

export type VoteModified = {
    proposalId: Address;
    voter: Address;
    voteAccount: Address;
    oldForVotesBp: bigint;
    oldAgainstVotesBp: bigint;
    oldAbstainVotesBp: bigint;
    newForVotesBp: bigint;
    newAgainstVotesBp: bigint;
    newAbstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    modificationTimestamp: bigint;
};

function getVoteModifiedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['voter', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['voteAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['oldForVotesBp', getU64Decoder()],
            ['oldAgainstVotesBp', getU64Decoder()],
            ['oldAbstainVotesBp', getU64Decoder()],
            ['newForVotesBp', getU64Decoder()],
            ['newAgainstVotesBp', getU64Decoder()],
            ['newAbstainVotesBp', getU64Decoder()],
            ['forVotesLamports', getU64Decoder()],
            ['againstVotesLamports', getU64Decoder()],
            ['abstainVotesLamports', getU64Decoder()],
            ['modificationTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(VOTE_MODIFIED_DISCRIMINATOR)],
    );
}

export function parseVoteModified(data: Uint8Array): VoteModified {
    if (!VOTE_MODIFIED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEMODIFIED discriminator mismatch');
    }
    const decoded = getVoteModifiedDecoder().decode(data);
    return decoded as VoteModified;
}
