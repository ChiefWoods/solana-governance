import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import {
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    transformDecoder,
    transformEncoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

export const NOMINATE_ADMIN_INSTRUCTION_DISCRIMINATOR = new Uint8Array([134, 11, 31, 244, 20, 77, 138, 121]);

export interface NominateAdminInstructionAccounts {
    admin: Address;
    globalConfig?: Address;
}

export interface NominateAdminInstructionArgs {
    proposedAdmin: Address;
}

function getNominateAdminInstructionDataEncoder(): Encoder<NominateAdminInstructionArgs> {
    return getStructEncoder([
        ['proposedAdmin', transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes())],
    ]);
}

function getNominateAdminInstructionDataDecoder(): Decoder<NominateAdminInstructionArgs> {
    return getStructDecoder([
        ['proposedAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
    ]);
}

export interface ParsedNominateAdminInstruction {
    programId: Address;
    accounts: {
        admin: AccountMeta;
        globalConfig: AccountMeta;
    };
    data: NominateAdminInstructionArgs;
}

export function parseNominateAdminInstruction(instruction: TransactionInstruction): ParsedNominateAdminInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for NominateAdmin instruction');
    }
    if (!NOMINATE_ADMIN_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('NominateAdmin instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            admin: instruction.keys[0]!,
            globalConfig: instruction.keys[1]!,
        },
        data: getNominateAdminInstructionDataDecoder().decode(instructionData),
    };
}

export async function createNominateAdminInstruction(
    accounts: NominateAdminInstructionAccounts,
    args: NominateAdminInstructionArgs,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.admin, isSigner: true, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: true },
    ];
    let data = Buffer.from(getNominateAdminInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(NOMINATE_ADMIN_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
