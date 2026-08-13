import { Address } from '@solana/web3.js';
import {
    addDecoderSizePrefix,
    fixDecoderSize,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getI64Decoder,
    getStructDecoder,
    getU32Decoder,
    getUtf8Decoder,
    transformDecoder,
} from '@solana/codecs';

export const PROPOSAL_CREATED_DISCRIMINATOR = new Uint8Array([186, 8, 160, 108, 81, 13, 51, 206]);

export function getProposalCreatedDiscriminatorBytes(): Uint8Array {
    return PROPOSAL_CREATED_DISCRIMINATOR;
}

export type ProposalCreated = {
    proposalId: Address;
    author: Address;
    title: string;
    description: string;
    creationTimestamp: bigint;
};

function getProposalCreatedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['author', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['title', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
            ['description', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
            ['creationTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(PROPOSAL_CREATED_DISCRIMINATOR)],
    );
}

export function parseProposalCreated(data: Uint8Array): ProposalCreated {
    if (!PROPOSAL_CREATED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALCREATED discriminator mismatch');
    }
    const decoded = getProposalCreatedDecoder().decode(data);
    return decoded as ProposalCreated;
}
