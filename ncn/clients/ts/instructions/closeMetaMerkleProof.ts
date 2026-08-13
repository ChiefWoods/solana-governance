import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export const CLOSE_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR = new Uint8Array([248, 239, 182, 146, 23, 215, 172, 3]);

export interface CloseMetaMerkleProofInstructionAccounts {
    payer: Address;
    metaMerkleProof: Address;
    systemProgram: Address;
}

export interface ParsedCloseMetaMerkleProofInstruction {
    programId: Address;
    accounts: {
        payer: AccountMeta;
        metaMerkleProof: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseCloseMetaMerkleProofInstruction(
    instruction: TransactionInstruction,
): ParsedCloseMetaMerkleProofInstruction {
    if (instruction.keys.length < 3) {
        throw new Error('Expected 3 account metas for CloseMetaMerkleProof instruction');
    }
    if (
        !CLOSE_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)
    ) {
        throw new Error('CloseMetaMerkleProof instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            payer: instruction.keys[0]!,
            metaMerkleProof: instruction.keys[1]!,
            systemProgram: instruction.keys[2]!,
        },
        data: {},
    };
}

export function createCloseMetaMerkleProofInstruction(
    accounts: CloseMetaMerkleProofInstructionAccounts,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.payer, isSigner: false, isWritable: true },
        { pubkey: accounts.metaMerkleProof, isSigner: false, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(CLOSE_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
