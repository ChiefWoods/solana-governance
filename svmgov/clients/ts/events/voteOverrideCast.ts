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

export const VOTE_OVERRIDE_CAST_DISCRIMINATOR = new Uint8Array([111, 204, 225, 252, 254, 218, 120, 236]);

export function getVoteOverrideCastDiscriminatorBytes(): Uint8Array {
    return VOTE_OVERRIDE_CAST_DISCRIMINATOR;
}

export type VoteOverrideCast = {
    proposalId: Address;
    delegator: Address;
    stakeAccount: Address;
    validator: Address;
    forVotesBp: bigint;
    againstVotesBp: bigint;
    abstainVotesBp: bigint;
    forVotesLamports: bigint;
    againstVotesLamports: bigint;
    abstainVotesLamports: bigint;
    stakeAmount: bigint;
    voteTimestamp: bigint;
};

function getVoteOverrideCastDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['delegator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['stakeAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['validator', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['forVotesBp', getU64Decoder()],
            ['againstVotesBp', getU64Decoder()],
            ['abstainVotesBp', getU64Decoder()],
            ['forVotesLamports', getU64Decoder()],
            ['againstVotesLamports', getU64Decoder()],
            ['abstainVotesLamports', getU64Decoder()],
            ['stakeAmount', getU64Decoder()],
            ['voteTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(VOTE_OVERRIDE_CAST_DISCRIMINATOR)],
    );
}

export function parseVoteOverrideCast(data: Uint8Array): VoteOverrideCast {
    if (!VOTE_OVERRIDE_CAST_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('VOTEOVERRIDECAST discriminator mismatch');
    }
    const decoded = getVoteOverrideCastDecoder().decode(data);
    return decoded as VoteOverrideCast;
}
