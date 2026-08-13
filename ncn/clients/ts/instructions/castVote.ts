import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import { getBallotDecoder, getBallotEncoder, type BallotArgs } from '../types/ballot';
import { getStructDecoder, getStructEncoder, type Decoder, type Encoder } from '@solana/codecs';

export const CAST_VOTE_INSTRUCTION_DISCRIMINATOR = new Uint8Array([20, 212, 15, 189, 69, 180, 69, 151]);

export interface CastVoteInstructionAccounts {
    operator: Address;
    ballotBox: Address;
}

export interface CastVoteInstructionArgs {
    ballot: BallotArgs;
}

function getCastVoteInstructionDataEncoder(): Encoder<CastVoteInstructionArgs> {
    return getStructEncoder([['ballot', getBallotEncoder()]]);
}

function getCastVoteInstructionDataDecoder(): Decoder<CastVoteInstructionArgs> {
    return getStructDecoder([['ballot', getBallotDecoder()]]);
}

export interface ParsedCastVoteInstruction {
    programId: Address;
    accounts: {
        operator: AccountMeta;
        ballotBox: AccountMeta;
    };
    data: CastVoteInstructionArgs;
}

export function parseCastVoteInstruction(instruction: TransactionInstruction): ParsedCastVoteInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for CastVote instruction');
    }
    if (!CAST_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('CastVote instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            operator: instruction.keys[0]!,
            ballotBox: instruction.keys[1]!,
        },
        data: getCastVoteInstructionDataDecoder().decode(instructionData),
    };
}

export function createCastVoteInstruction(
    accounts: CastVoteInstructionAccounts,
    args: CastVoteInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.operator, isSigner: true, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
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
