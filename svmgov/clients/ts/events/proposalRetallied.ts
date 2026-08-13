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

export const PROPOSAL_RETALLIED_DISCRIMINATOR = new Uint8Array([50, 227, 187, 86, 132, 93, 57, 3]);

export function getProposalRetalliedDiscriminatorBytes(): Uint8Array {
    return PROPOSAL_RETALLIED_DISCRIMINATOR;
}

export type ProposalRetallied = {
    proposalId: Address;
    caller: Address;
    clusterSupportLamports: bigint;
    votingActivated: boolean;
    snapshotSlot: bigint;
};

function getProposalRetalliedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['caller', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['clusterSupportLamports', getU64Decoder()],
            ['votingActivated', getBooleanDecoder()],
            ['snapshotSlot', getU64Decoder()],
        ]),
        [getConstantDecoder(PROPOSAL_RETALLIED_DISCRIMINATOR)],
    );
}

export function parseProposalRetallied(data: Uint8Array): ProposalRetallied {
    if (!PROPOSAL_RETALLIED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('PROPOSALRETALLIED discriminator mismatch');
    }
    const decoded = getProposalRetalliedDecoder().decode(data);
    return decoded as ProposalRetallied;
}
