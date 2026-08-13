import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';

export const ACCEPT_ADMIN_INSTRUCTION_DISCRIMINATOR = new Uint8Array([112, 42, 45, 90, 116, 181, 13, 170]);

export interface AcceptAdminInstructionAccounts {
    newAdmin: Address;
    globalConfig?: Address;
}

export interface ParsedAcceptAdminInstruction {
    programId: Address;
    accounts: {
        newAdmin: AccountMeta;
        globalConfig: AccountMeta;
    };
    data: {};
}

export function parseAcceptAdminInstruction(instruction: TransactionInstruction): ParsedAcceptAdminInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for AcceptAdmin instruction');
    }
    if (!ACCEPT_ADMIN_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('AcceptAdmin instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            newAdmin: instruction.keys[0]!,
            globalConfig: instruction.keys[1]!,
        },
        data: {},
    };
}

export async function createAcceptAdminInstruction(
    accounts: AcceptAdminInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.newAdmin, isSigner: true, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: true },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(ACCEPT_ADMIN_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
