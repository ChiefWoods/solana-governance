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
} from '@solana/codecs';

export type StakeMerkleLeaf = {
    /** Wallet designated for governance voting for the stake account. */
    votingWallet: Address;
    /** The stake account address. */
    stakeAccount: Address;
    /** Active delegated stake amount. */
    activeStake: bigint;
};

export type StakeMerkleLeafArgs = {
    /** Wallet designated for governance voting for the stake account. */
    votingWallet: Address;
    /** The stake account address. */
    stakeAccount: Address;
    /** Active delegated stake amount. */
    activeStake: number | bigint;
};

export function getStakeMerkleLeafEncoder(): Encoder<StakeMerkleLeafArgs> {
    return getStructEncoder([
        ['votingWallet', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
        ['stakeAccount', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
        ['activeStake', getU64Encoder()],
    ]);
}

export function getStakeMerkleLeafDecoder(): Decoder<StakeMerkleLeaf> {
    return getStructDecoder([
        ['votingWallet', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['stakeAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ['activeStake', getU64Decoder()],
    ]);
}

export function getStakeMerkleLeafCodec(): Codec<StakeMerkleLeafArgs, StakeMerkleLeaf> {
    return combineCodec(getStakeMerkleLeafEncoder(), getStakeMerkleLeafDecoder());
}
