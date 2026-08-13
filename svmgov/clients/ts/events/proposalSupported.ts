import { Address } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBooleanDecoder,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getStructDecoder,
    getU64Decoder,
    transformDecoder,
} from '@solana/codecs';

export const PROPOSAL_SUPPORTED_DISCRIMINATOR = new Uint8Array([248, 220, 71, 30, 127, 209, 67, 231]);

export function getProposalSupportedDiscriminatorBytes(): Uint8Array {
    return PROPOSAL_SUPPORTED_DISCRIMINATOR;
}

export type ProposalSupported = {
    proposalId: Address;
    supporter: Address;
    clusterSupportLamports: bigint;
    votingActivated: boolean;
    snapshotSlot: bigint;
};

function getProposalSupportedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['supporter', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['clusterSupportLamports', getU64Decoder()],
            ['votingActivated', getBooleanDecoder()],
            ['snapshotSlot', getU64Decoder()],
        ]),
        [getConstantDecoder(PROPOSAL_SUPPORTED_DISCRIMINATOR)],
    );
}

export function parseProposalSupported(data: Uint8Array): ProposalSupported {
    if (!PROPOSAL_SUPPORTED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALSUPPORTED discriminator mismatch');
    }
    const decoded = getProposalSupportedDecoder().decode(data);
    return decoded as ProposalSupported;
}
