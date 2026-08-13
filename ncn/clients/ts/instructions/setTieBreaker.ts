import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import { getBallotDecoder, getBallotEncoder, type BallotArgs } from '../types/ballot';
import { getStructDecoder, getStructEncoder, type Decoder, type Encoder } from '@solana/codecs';

export const SET_TIE_BREAKER_INSTRUCTION_DISCRIMINATOR = new Uint8Array([228, 10, 240, 130, 193, 58, 103, 181]);

export interface SetTieBreakerInstructionAccounts {
    tieBreakerAdmin: Address;
    ballotBox: Address;
    programConfig: Address;
}

export interface SetTieBreakerInstructionArgs {
    ballot: BallotArgs;
}

function getSetTieBreakerInstructionDataEncoder(): Encoder<SetTieBreakerInstructionArgs> {
    return getStructEncoder([['ballot', getBallotEncoder()]]);
}

function getSetTieBreakerInstructionDataDecoder(): Decoder<SetTieBreakerInstructionArgs> {
    return getStructDecoder([['ballot', getBallotDecoder()]]);
}

export interface ParsedSetTieBreakerInstruction {
    programId: Address;
    accounts: {
        tieBreakerAdmin: AccountMeta;
        ballotBox: AccountMeta;
        programConfig: AccountMeta;
    };
    data: SetTieBreakerInstructionArgs;
}

export function parseSetTieBreakerInstruction(instruction: TransactionInstruction): ParsedSetTieBreakerInstruction {
    if (instruction.keys.length < 3) {
        throw new Error('Expected 3 account metas for SetTieBreaker instruction');
    }
    if (!SET_TIE_BREAKER_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('SetTieBreaker instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            tieBreakerAdmin: instruction.keys[0]!,
            ballotBox: instruction.keys[1]!,
            programConfig: instruction.keys[2]!,
        },
        data: getSetTieBreakerInstructionDataDecoder().decode(instructionData),
    };
}

export function createSetTieBreakerInstruction(
    accounts: SetTieBreakerInstructionAccounts,
    args: SetTieBreakerInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.tieBreakerAdmin, isSigner: true, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getSetTieBreakerInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(SET_TIE_BREAKER_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
