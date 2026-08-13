import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export const FINALIZE_PROPOSAL_INSTRUCTION_DISCRIMINATOR = new Uint8Array([23, 68, 51, 167, 109, 173, 187, 164]);

export interface FinalizeProposalInstructionAccounts {
    signer: Address;
    proposal: Address;
}

export interface ParsedFinalizeProposalInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
    };
    data: {};
}

export function parseFinalizeProposalInstruction(
    instruction: TransactionInstruction,
): ParsedFinalizeProposalInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for FinalizeProposal instruction');
    }
    if (!FINALIZE_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('FinalizeProposal instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
        },
        data: {},
    };
}

export function createFinalizeProposalInstruction(
    accounts: FinalizeProposalInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: false },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(FINALIZE_PROPOSAL_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
