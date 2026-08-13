import { Address } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getI64Decoder,
    getStructDecoder,
    getU32Decoder,
    getU64Decoder,
    transformDecoder,
} from '@solana/codecs';

export const PROPOSAL_FINALIZED_DISCRIMINATOR = new Uint8Array([159, 104, 210, 220, 86, 209, 61, 51]);

export function getProposalFinalizedDiscriminatorBytes(): Uint8Array {
    return PROPOSAL_FINALIZED_DISCRIMINATOR;
}

export type ProposalFinalized = {
    proposalId: Address;
    finalizer: Address;
    totalForVotes: bigint;
    totalAgainstVotes: bigint;
    totalAbstainVotes: bigint;
    totalVotesCount: number;
    finalizationTimestamp: bigint;
};

function getProposalFinalizedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['finalizer', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['totalForVotes', getU64Decoder()],
            ['totalAgainstVotes', getU64Decoder()],
            ['totalAbstainVotes', getU64Decoder()],
            ['totalVotesCount', getU32Decoder()],
            ['finalizationTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(PROPOSAL_FINALIZED_DISCRIMINATOR)],
    );
}

export function parseProposalFinalized(data: Uint8Array): ProposalFinalized {
    if (!PROPOSAL_FINALIZED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALFINALIZED discriminator mismatch');
    }
    const decoded = getProposalFinalizedDecoder().decode(data);
    return decoded as ProposalFinalized;
}
