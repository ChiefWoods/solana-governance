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

export const VOTE_OVERRIDE_MODIFIED_DISCRIMINATOR = new Uint8Array([235, 74, 153, 225, 242, 72, 228, 9]);

export function getVoteOverrideModifiedDiscriminatorBytes(): Uint8Array {
    return VOTE_OVERRIDE_MODIFIED_DISCRIMINATOR;
}

export type VoteOverrideModified = {
    proposalId: Address;
    delegator: Address;
    stakeAccount: Address;
    validator: Address;
    oldForVotesBp: bigint;
    oldAgainstVotesBp: bigint;
    oldAbstainVotesBp: bigint;
    newForVotesBp: bigint;
    newAgainstVotesBp: bigint;
    newAbstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stakeAmount: bigint;
    modificationTimestamp: bigint;
};

function getVoteOverrideModifiedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['delegator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['stakeAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['oldForVotesBp', getU64Decoder()],
            ['oldAgainstVotesBp', getU64Decoder()],
            ['oldAbstainVotesBp', getU64Decoder()],
            ['newForVotesBp', getU64Decoder()],
            ['newAgainstVotesBp', getU64Decoder()],
            ['newAbstainVotesBp', getU64Decoder()],
            ['forVotesLamports', getU64Decoder()],
            ['againstVotesLamports', getU64Decoder()],
            ['abstainVotesLamports', getU64Decoder()],
            ['stakeAmount', getU64Decoder()],
            ['modificationTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(VOTE_OVERRIDE_MODIFIED_DISCRIMINATOR)],
    );
}

export function parseVoteOverrideModified(data: Uint8Array): VoteOverrideModified {
    if (!VOTE_OVERRIDE_MODIFIED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEOVERRIDEMODIFIED discriminator mismatch');
    }
    const decoded = getVoteOverrideModifiedDecoder().decode(data);
    return decoded as VoteOverrideModified;
}
