import { Address } from '@solana/web3.js';
import {
    combineCodec,
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    transformDecoder,
    transformEncoder,
    type Codec,
    type Decoder,
    type Encoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';

export type MetaMerkleLeaf = {
    /** Wallet designated for governance voting for the vote account. */
    votingWallet: Address;
    /** Validator's vote account. */
    voteAccount: Address;
    /**
     * Root hash of the StakeMerkleTree, representing all active stake accounts
     * delegated to the current vote account.
     */
    stakeMerkleRoot: ReadonlyUint8Array;
    /** Total active delegated stake under this vote account. */
    activeStake: bigint;
};

export type MetaMerkleLeafArgs = {
    /** Wallet designated for governance voting for the vote account. */
    votingWallet: Address;
    /** Validator's vote account. */
    voteAccount: Address;
    /**
     * Root hash of the StakeMerkleTree, representing all active stake accounts
     * delegated to the current vote account.
     */
    stakeMerkleRoot: ReadonlyUint8Array;
    /** Total active delegated stake under this vote account. */
    activeStake: number | bigint;
};

export function getMetaMerkleLeafEncoder(): Encoder<MetaMerkleLeafArgs> {
    return getStructEncoder([
        ['votingWallet', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
        ['voteAccount', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
        ['stakeMerkleRoot', fixEncoderSize(getBytesEncoder(), 32)],
        ['activeStake', getU64Encoder()],
    ]);
}

export function getMetaMerkleLeafDecoder(): Decoder<MetaMerkleLeaf> {
    return getStructDecoder([
        ['votingWallet', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['voteAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['stakeMerkleRoot', fixDecoderSize(getBytesDecoder(), 32)],
        ['activeStake', getU64Decoder()],
    ]);
}

export function getMetaMerkleLeafCodec(): Codec<MetaMerkleLeafArgs, MetaMerkleLeaf> {
    return combineCodec(getMetaMerkleLeafEncoder(), getMetaMerkleLeafDecoder());
}
