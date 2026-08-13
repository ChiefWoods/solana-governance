import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findCastVoteOverrideVoteOverrideCachePda } from '../pdas/castVoteOverrideVoteOverrideCache';
import { findVoteOverridePda } from '../pdas/voteOverride';
import { findVotePda } from '../pdas/vote';
import {
    fixDecoderSize,
    fixEncoderSize,
    getArrayDecoder,
    getArrayEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    type Decoder,
    type Encoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import {
    getStakeMerkleLeafDecoder,
    getStakeMerkleLeafEncoder,
    type StakeMerkleLeafArgs,
} from '../types/stakeMerkleLeaf';

export const CAST_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR = new Uint8Array([225, 8, 137, 98, 214, 156, 183, 62]);

export interface CastVoteOverrideInstructionAccounts {
    signer: Address;
    proposal: Address;
    validatorVote?: Address;
    splVoteAccount: Address;
    voteOverride?: Address;
    voteOverrideCache?: Address;
    splStakeAccount: Address;
    snapshotProgram: Address;
    consensusResult: Address;
    metaMerkleProof: Address;
    systemProgram: Address;
}

export interface CastVoteOverrideInstructionArgs {
    forVotesBp: number | bigint;
    againstVotesBp: number | bigint;
    abstainVotesBp: number | bigint;
    stakeMerkleProof: Array<ReadonlyUint8Array>;
    stakeMerkleLeaf: StakeMerkleLeafArgs;
}

function getCastVoteOverrideInstructionDataEncoder(): Encoder<CastVoteOverrideInstructionArgs> {
    return getStructEncoder([
        ['forVotesBp', getU64Encoder()],
        ['againstVotesBp', getU64Encoder()],
        ['abstainVotesBp', getU64Encoder()],
        ['stakeMerkleProof', getArrayEncoder(fixEncoderSize(getBytesEncoder(), 32))],
        ['stakeMerkleLeaf', getStakeMerkleLeafEncoder()],
    ]);
}

function getCastVoteOverrideInstructionDataDecoder(): Decoder<CastVoteOverrideInstructionArgs> {
    return getStructDecoder([
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
        ['stakeMerkleProof', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 32))],
        ['stakeMerkleLeaf', getStakeMerkleLeafDecoder()],
    ]);
}

export interface ParsedCastVoteOverrideInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        validatorVote: AccountMeta;
        splVoteAccount: AccountMeta;
        voteOverride: AccountMeta;
        voteOverrideCache: AccountMeta;
        splStakeAccount: AccountMeta;
        snapshotProgram: AccountMeta;
        consensusResult: AccountMeta;
        metaMerkleProof: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: CastVoteOverrideInstructionArgs;
}

export function parseCastVoteOverrideInstruction(
    instruction: TransactionInstruction,
): ParsedCastVoteOverrideInstruction {
    if (instruction.keys.length < 11) {
        throw new Error('Expected 11 account metas for CastVoteOverride instruction');
    }
    if (!CAST_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('CastVoteOverride instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            validatorVote: instruction.keys[2]!,
            splVoteAccount: instruction.keys[3]!,
            voteOverride: instruction.keys[4]!,
            voteOverrideCache: instruction.keys[5]!,
            splStakeAccount: instruction.keys[6]!,
            snapshotProgram: instruction.keys[7]!,
            consensusResult: instruction.keys[8]!,
            metaMerkleProof: instruction.keys[9]!,
            systemProgram: instruction.keys[10]!,
        },
        data: getCastVoteOverrideInstructionDataDecoder().decode(instructionData),
    };
}

export async function createCastVoteOverrideInstruction(
    accounts: CastVoteOverrideInstructionAccounts,
    args: CastVoteOverrideInstructionArgs,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let validatorVote = accounts.validatorVote;
    if (!validatorVote) {
        const [derived] = await findVotePda(
            {
                proposal: accounts.proposal,
                splVoteAccount: accounts.splVoteAccount,
            },
            programId,
        );
        validatorVote = derived;
    }
    let voteOverride = accounts.voteOverride;
    if (!voteOverride) {
        const [derived] = await findVoteOverridePda(
            {
                proposal: accounts.proposal,
                splStakeAccount: accounts.splStakeAccount,
                validatorVote: accounts.validatorVote,
            },
            programId,
        );
        voteOverride = derived;
    }
    let voteOverrideCache = accounts.voteOverrideCache;
    if (!voteOverrideCache) {
        const [derived] = await findCastVoteOverrideVoteOverrideCachePda(
            {
                proposal: accounts.proposal,
                validatorVote: accounts.validatorVote,
            },
            programId,
        );
        voteOverrideCache = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
        { pubkey: validatorVote, isSigner: false, isWritable: true },
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: voteOverride, isSigner: false, isWritable: true },
        { pubkey: voteOverrideCache, isSigner: false, isWritable: true },
        { pubkey: accounts.splStakeAccount, isSigner: false, isWritable: false },
        { pubkey: accounts.snapshotProgram, isSigner: false, isWritable: false },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: false },
        { pubkey: accounts.metaMerkleProof, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getCastVoteOverrideInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(CAST_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
