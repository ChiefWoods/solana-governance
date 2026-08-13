import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export const FINALIZE_PROPOSED_AUTHORITY_INSTRUCTION_DISCRIMINATOR = new Uint8Array([
    89, 96, 108, 130, 223, 223, 213, 102,
]);

export interface FinalizeProposedAuthorityInstructionAccounts {
    authority: Address;
    programConfig: Address;
}

export interface ParsedFinalizeProposedAuthorityInstruction {
    programId: Address;
    accounts: {
        authority: AccountMeta;
        programConfig: AccountMeta;
    };
    data: {};
}

export function parseFinalizeProposedAuthorityInstruction(
    instruction: TransactionInstruction,
): ParsedFinalizeProposedAuthorityInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for FinalizeProposedAuthority instruction');
    }
    if (
        !FINALIZE_PROPOSED_AUTHORITY_INSTRUCTION_DISCRIMINATOR.every(
            (byte, index) => instruction.data[0 + index] === byte,
        )
    ) {
        throw new Error('FinalizeProposedAuthority instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            authority: instruction.keys[0]!,
            programConfig: instruction.keys[1]!,
        },
        data: {},
    };
}

export function createFinalizeProposedAuthorityInstruction(
    accounts: FinalizeProposedAuthorityInstructionAccounts,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.authority, isSigner: true, isWritable: false },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: true },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(FINALIZE_PROPOSED_AUTHORITY_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
