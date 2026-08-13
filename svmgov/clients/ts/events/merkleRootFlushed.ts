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

export const MERKLE_ROOT_FLUSHED_DISCRIMINATOR = new Uint8Array([120, 37, 53, 216, 119, 172, 17, 144]);

export function getMerkleRootFlushedDiscriminatorBytes(): Uint8Array {
    return MERKLE_ROOT_FLUSHED_DISCRIMINATOR;
}

export type MerkleRootFlushed = {
    proposalId: Address;
    author: Address;
    newSnapshotSlot: bigint;
    flushTimestamp: bigint;
};

function getMerkleRootFlushedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['proposalId', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['author', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['newSnapshotSlot', getU64Decoder()],
            ['flushTimestamp', getI64Decoder()],
        ]),
        [getConstantDecoder(MERKLE_ROOT_FLUSHED_DISCRIMINATOR)],
    );
}

export function parseMerkleRootFlushed(data: Uint8Array): MerkleRootFlushed {
    if (!MERKLE_ROOT_FLUSHED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('MERKLEROOTFLUSHED discriminator mismatch');
    }
    const decoded = getMerkleRootFlushedDecoder().decode(data);
    return decoded as MerkleRootFlushed;
}
