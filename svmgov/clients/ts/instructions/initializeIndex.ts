import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findProposalIndexPda } from '../pdas/proposalIndex';

export const INITIALIZE_INDEX_INSTRUCTION_DISCRIMINATOR = new Uint8Array([204, 67, 3, 74, 139, 139, 233, 10]);

export interface InitializeIndexInstructionAccounts {
    signer: Address;
    proposalIndex?: Address;
    systemProgram: Address;
}

export interface ParsedInitializeIndexInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposalIndex: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseInitializeIndexInstruction(instruction: TransactionInstruction): ParsedInitializeIndexInstruction {
    if (instruction.keys.length < 3) {
        throw new Error('Expected 3 account metas for InitializeIndex instruction');
    }
    if (!INITIALIZE_INDEX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('InitializeIndex instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposalIndex: instruction.keys[1]!,
            systemProgram: instruction.keys[2]!,
        },
        data: {},
    };
}

export async function createInitializeIndexInstruction(
    accounts: InitializeIndexInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let proposalIndex = accounts.proposalIndex;
    if (!proposalIndex) {
        const [derived] = await findProposalIndexPda(programId);
        proposalIndex = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: proposalIndex, isSigner: false, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(INITIALIZE_INDEX_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
