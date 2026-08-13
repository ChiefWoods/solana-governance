import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findVoteOverrideCachePda } from '../pdas/voteOverrideCache';
import { findVotePda } from '../pdas/vote';
import {
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

export const CAST_VOTE_INSTRUCTION_DISCRIMINATOR = new Uint8Array([20, 212, 15, 189, 69, 180, 69, 151]);

export interface CastVoteInstructionAccounts {
    signer: Address;
    proposal: Address;
    vote?: Address;
    splVoteAccount: Address;
    voteOverrideCache?: Address;
    snapshotProgram: Address;
    consensusResult: Address;
    metaMerkleProof: Address;
    systemProgram: Address;
}

export interface CastVoteInstructionArgs {
    forVotesBp: number | bigint;
    againstVotesBp: number | bigint;
    abstainVotesBp: number | bigint;
}

function getCastVoteInstructionDataEncoder(): Encoder<CastVoteInstructionArgs> {
    return getStructEncoder([
        ['forVotesBp', getU64Encoder()],
        ['againstVotesBp', getU64Encoder()],
        ['abstainVotesBp', getU64Encoder()],
    ]);
}

function getCastVoteInstructionDataDecoder(): Decoder<CastVoteInstructionArgs> {
    return getStructDecoder([
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
    ]);
}

export interface ParsedCastVoteInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        vote: AccountMeta;
        splVoteAccount: AccountMeta;
        voteOverrideCache: AccountMeta;
        snapshotProgram: AccountMeta;
        consensusResult: AccountMeta;
        metaMerkleProof: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: CastVoteInstructionArgs;
}

export function parseCastVoteInstruction(instruction: TransactionInstruction): ParsedCastVoteInstruction {
    if (instruction.keys.length < 9) {
        throw new Error('Expected 9 account metas for CastVote instruction');
    }
    if (!CAST_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('CastVote instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            vote: instruction.keys[2]!,
            splVoteAccount: instruction.keys[3]!,
            voteOverrideCache: instruction.keys[4]!,
            snapshotProgram: instruction.keys[5]!,
            consensusResult: instruction.keys[6]!,
            metaMerkleProof: instruction.keys[7]!,
            systemProgram: instruction.keys[8]!,
        },
        data: getCastVoteInstructionDataDecoder().decode(instructionData),
    };
}

export async function createCastVoteInstruction(
    accounts: CastVoteInstructionAccounts,
    args: CastVoteInstructionArgs,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let vote = accounts.vote;
    if (!vote) {
        const [derived] = await findVotePda(
            {
                proposal: accounts.proposal,
                splVoteAccount: accounts.splVoteAccount,
            },
            programId,
        );
        vote = derived;
    }
    let voteOverrideCache = accounts.voteOverrideCache;
    if (!voteOverrideCache) {
        const [derived] = await findVoteOverrideCachePda(
            {
                proposal: accounts.proposal,
                vote: accounts.vote,
            },
            programId,
        );
        voteOverrideCache = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
        { pubkey: vote, isSigner: false, isWritable: true },
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: voteOverrideCache, isSigner: false, isWritable: true },
        { pubkey: accounts.snapshotProgram, isSigner: false, isWritable: false },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: false },
        { pubkey: accounts.metaMerkleProof, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getCastVoteInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(CAST_VOTE_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
