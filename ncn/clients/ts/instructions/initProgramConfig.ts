import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import { findProgramConfigPda } from '../pdas/programConfig';
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

export const INIT_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR = new Uint8Array([185, 54, 237, 229, 219, 179, 109, 20]);

export interface InitProgramConfigInstructionAccounts {
    payer: Address;
    authority: Address;
    programConfig?: Address;
    systemProgram: Address;
}

export interface InitProgramConfigInstructionArgs {
    svmgovProgramPubkey: Address;
}

function getInitProgramConfigInstructionDataEncoder(): Encoder<InitProgramConfigInstructionArgs> {
    return getStructEncoder([
        [
            'svmgovProgramPubkey',
            transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
        ],
    ]);
}

function getInitProgramConfigInstructionDataDecoder(): Decoder<InitProgramConfigInstructionArgs> {
    return getStructDecoder([
        ['svmgovProgramPubkey', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
    ]);
}

export interface ParsedInitProgramConfigInstruction {
    programId: Address;
    accounts: {
        payer: AccountMeta;
        authority: AccountMeta;
        programConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: InitProgramConfigInstructionArgs;
}

export function parseInitProgramConfigInstruction(
    instruction: TransactionInstruction,
): ParsedInitProgramConfigInstruction {
    if (instruction.keys.length < 4) {
        throw new Error('Expected 4 account metas for InitProgramConfig instruction');
    }
    if (!INIT_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('InitProgramConfig instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            payer: instruction.keys[0]!,
            authority: instruction.keys[1]!,
            programConfig: instruction.keys[2]!,
            systemProgram: instruction.keys[3]!,
        },
        data: getInitProgramConfigInstructionDataDecoder().decode(instructionData),
    };
}

export async function createInitProgramConfigInstruction(
    accounts: InitProgramConfigInstructionAccounts,
    args: InitProgramConfigInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let programConfig = accounts.programConfig;
    if (!programConfig) {
        const [derived] = await findProgramConfigPda(programId);
        programConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.payer, isSigner: true, isWritable: true },
        { pubkey: accounts.authority, isSigner: true, isWritable: false },
        { pubkey: programConfig, isSigner: false, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getInitProgramConfigInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(INIT_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
