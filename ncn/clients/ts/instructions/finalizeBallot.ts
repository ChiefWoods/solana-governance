import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export const FINALIZE_BALLOT_INSTRUCTION_DISCRIMINATOR = new Uint8Array([212, 43, 85, 58, 158, 34, 41, 42]);

export interface FinalizeBallotInstructionAccounts {
    payer: Address;
    ballotBox: Address;
    consensusResult: Address;
    systemProgram: Address;
}

export interface ParsedFinalizeBallotInstruction {
    programId: Address;
    accounts: {
        payer: AccountMeta;
        ballotBox: AccountMeta;
        consensusResult: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseFinalizeBallotInstruction(instruction: TransactionInstruction): ParsedFinalizeBallotInstruction {
    if (instruction.keys.length < 4) {
        throw new Error('Expected 4 account metas for FinalizeBallot instruction');
    }
    if (!FINALIZE_BALLOT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('FinalizeBallot instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            payer: instruction.keys[0]!,
            ballotBox: instruction.keys[1]!,
            consensusResult: instruction.keys[2]!,
            systemProgram: instruction.keys[3]!,
        },
        data: {},
    };
}

export function createFinalizeBallotInstruction(
    accounts: FinalizeBallotInstructionAccounts,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.payer, isSigner: true, isWritable: true },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: false },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(FINALIZE_BALLOT_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
