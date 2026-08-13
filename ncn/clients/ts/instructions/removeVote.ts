import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export const REMOVE_VOTE_INSTRUCTION_DISCRIMINATOR = new Uint8Array([32, 187, 23, 3, 156, 232, 55, 177]);

export interface RemoveVoteInstructionAccounts {
    operator: Address;
    ballotBox: Address;
}

export interface ParsedRemoveVoteInstruction {
    programId: Address;
    accounts: {
        operator: AccountMeta;
        ballotBox: AccountMeta;
    };
    data: {};
}

export function parseRemoveVoteInstruction(instruction: TransactionInstruction): ParsedRemoveVoteInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for RemoveVote instruction');
    }
    if (!REMOVE_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('RemoveVote instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            operator: instruction.keys[0]!,
            ballotBox: instruction.keys[1]!,
        },
        data: {},
    };
}

export function createRemoveVoteInstruction(
    accounts: RemoveVoteInstructionAccounts,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.operator, isSigner: true, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(REMOVE_VOTE_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
