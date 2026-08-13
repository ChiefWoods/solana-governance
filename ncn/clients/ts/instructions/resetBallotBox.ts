import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export const RESET_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR = new Uint8Array([108, 127, 131, 171, 226, 219, 67, 163]);

export interface ResetBallotBoxInstructionAccounts {
    tieBreakerAdmin: Address;
    ballotBox: Address;
    programConfig: Address;
}

export interface ParsedResetBallotBoxInstruction {
    programId: Address;
    accounts: {
        tieBreakerAdmin: AccountMeta;
        ballotBox: AccountMeta;
        programConfig: AccountMeta;
    };
    data: {};
}

export function parseResetBallotBoxInstruction(instruction: TransactionInstruction): ParsedResetBallotBoxInstruction {
    if (instruction.keys.length < 3) {
        throw new Error('Expected 3 account metas for ResetBallotBox instruction');
    }
    if (!RESET_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('ResetBallotBox instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            tieBreakerAdmin: instruction.keys[0]!,
            ballotBox: instruction.keys[1]!,
            programConfig: instruction.keys[2]!,
        },
        data: {},
    };
}

export function createResetBallotBoxInstruction(
    accounts: ResetBallotBoxInstructionAccounts,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.tieBreakerAdmin, isSigner: true, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(RESET_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
