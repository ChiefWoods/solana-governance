import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findVotePda } from '../pdas/vote';
import {
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

export const MODIFY_VOTE_INSTRUCTION_DISCRIMINATOR = new Uint8Array([116, 52, 102, 0, 121, 145, 27, 139]);

export interface ModifyVoteInstructionAccounts {
    signer: Address;
    proposal: Address;
    vote?: Address;
    splVoteAccount: Address;
    snapshotProgram: Address;
    consensusResult: Address;
    metaMerkleProof: Address;
    systemProgram: Address;
}

export interface ModifyVoteInstructionArgs {
    forVotesBp: number | bigint;
    againstVotesBp: number | bigint;
    abstainVotesBp: number | bigint;
}

function getModifyVoteInstructionDataEncoder(): Encoder<ModifyVoteInstructionArgs> {
    return getStructEncoder([
        ['forVotesBp', getU64Encoder()],
        ['againstVotesBp', getU64Encoder()],
        ['abstainVotesBp', getU64Encoder()],
    ]);
}

function getModifyVoteInstructionDataDecoder(): Decoder<ModifyVoteInstructionArgs> {
    return getStructDecoder([
        ['forVotesBp', getU64Decoder()],
        ['againstVotesBp', getU64Decoder()],
        ['abstainVotesBp', getU64Decoder()],
    ]);
}

export interface ParsedModifyVoteInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        vote: AccountMeta;
        splVoteAccount: AccountMeta;
        snapshotProgram: AccountMeta;
        consensusResult: AccountMeta;
        metaMerkleProof: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: ModifyVoteInstructionArgs;
}

export function parseModifyVoteInstruction(instruction: TransactionInstruction): ParsedModifyVoteInstruction {
    if (instruction.keys.length < 8) {
        throw new Error('Expected 8 account metas for ModifyVote instruction');
    }
    if (!MODIFY_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('ModifyVote instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            vote: instruction.keys[2]!,
            splVoteAccount: instruction.keys[3]!,
            snapshotProgram: instruction.keys[4]!,
            consensusResult: instruction.keys[5]!,
            metaMerkleProof: instruction.keys[6]!,
            systemProgram: instruction.keys[7]!,
        },
        data: getModifyVoteInstructionDataDecoder().decode(instructionData),
    };
}

export async function createModifyVoteInstruction(
    accounts: ModifyVoteInstructionAccounts,
    args: ModifyVoteInstructionArgs,
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
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: false },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
        { pubkey: vote, isSigner: false, isWritable: true },
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: accounts.snapshotProgram, isSigner: false, isWritable: false },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: false },
        { pubkey: accounts.metaMerkleProof, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getModifyVoteInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(MODIFY_VOTE_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
