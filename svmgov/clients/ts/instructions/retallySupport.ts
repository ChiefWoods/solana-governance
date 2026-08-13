import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import { findProgramConfigPda } from '../pdas/programConfig';

export const RETALLY_SUPPORT_INSTRUCTION_DISCRIMINATOR = new Uint8Array([132, 55, 145, 255, 12, 163, 151, 141]);

export interface RetallySupportInstructionAccounts {
    signer: Address;
    proposal: Address;
    ballotBox: Address;
    ballotProgram: Address;
    programConfig?: Address;
    globalConfig?: Address;
    systemProgram: Address;
}

export interface ParsedRetallySupportInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        ballotBox: AccountMeta;
        ballotProgram: AccountMeta;
        programConfig: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseRetallySupportInstruction(instruction: TransactionInstruction): ParsedRetallySupportInstruction {
    if (instruction.keys.length < 7) {
        throw new Error('Expected 7 account metas for RetallySupport instruction');
    }
    if (!RETALLY_SUPPORT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('RetallySupport instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            ballotBox: instruction.keys[2]!,
            ballotProgram: instruction.keys[3]!,
            programConfig: instruction.keys[4]!,
            globalConfig: instruction.keys[5]!,
            systemProgram: instruction.keys[6]!,
        },
        data: {},
    };
}

export async function createRetallySupportInstruction(
    accounts: RetallySupportInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let programConfig = accounts.programConfig;
    if (!programConfig) {
        const [derived] = await findProgramConfigPda(programId);
        programConfig = derived;
    }
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
        { pubkey: accounts.ballotProgram, isSigner: false, isWritable: false },
        { pubkey: programConfig, isSigner: false, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(RETALLY_SUPPORT_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
