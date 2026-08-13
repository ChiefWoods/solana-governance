import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import {
    getI64Decoder,
    getI64Encoder,
    getStructDecoder,
    getStructEncoder,
    getU16Decoder,
    getU16Encoder,
    getU32Decoder,
    getU32Encoder,
    getU64Decoder,
    getU64Encoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

export const INITIALIZE_CONFIG_INSTRUCTION_DISCRIMINATOR = new Uint8Array([208, 127, 21, 1, 194, 190, 196, 70]);

export interface InitializeConfigInstructionAccounts {
    admin: Address;
    globalConfig?: Address;
    systemProgram: Address;
    program: Address;
    programData: Address;
}

export interface InitializeConfigInstructionArgs {
    maxTitleLength: number;
    maxDescriptionLength: number;
    maxSupportEpochs: number | bigint;
    minProposalStakeLamports: number | bigint;
    clusterSupportPctMinBps: number | bigint;
    discussionEpochs: number | bigint;
    votingEpochs: number | bigint;
    snapshotEpochExtension: number | bigint;
    snapshotSlotOffset: number | bigint;
    maxSupporters: number;
}

function getInitializeConfigInstructionDataEncoder(): Encoder<InitializeConfigInstructionArgs> {
    return getStructEncoder([
        ['maxTitleLength', getU16Encoder()],
        ['maxDescriptionLength', getU16Encoder()],
        ['maxSupportEpochs', getU64Encoder()],
        ['minProposalStakeLamports', getU64Encoder()],
        ['clusterSupportPctMinBps', getU64Encoder()],
        ['discussionEpochs', getU64Encoder()],
        ['votingEpochs', getU64Encoder()],
        ['snapshotEpochExtension', getU64Encoder()],
        ['snapshotSlotOffset', getI64Encoder()],
        ['maxSupporters', getU32Encoder()],
    ]);
}

function getInitializeConfigInstructionDataDecoder(): Decoder<InitializeConfigInstructionArgs> {
    return getStructDecoder([
        ['maxTitleLength', getU16Decoder()],
        ['maxDescriptionLength', getU16Decoder()],
        ['maxSupportEpochs', getU64Decoder()],
        ['minProposalStakeLamports', getU64Decoder()],
        ['clusterSupportPctMinBps', getU64Decoder()],
        ['discussionEpochs', getU64Decoder()],
        ['votingEpochs', getU64Decoder()],
        ['snapshotEpochExtension', getU64Decoder()],
        ['snapshotSlotOffset', getI64Decoder()],
        ['maxSupporters', getU32Decoder()],
    ]);
}

export interface ParsedInitializeConfigInstruction {
    programId: Address;
    accounts: {
        admin: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
        program: AccountMeta;
        programData: AccountMeta;
    };
    data: InitializeConfigInstructionArgs;
}

export function parseInitializeConfigInstruction(
    instruction: TransactionInstruction,
): ParsedInitializeConfigInstruction {
    if (instruction.keys.length < 5) {
        throw new Error('Expected 5 account metas for InitializeConfig instruction');
    }
    if (!INITIALIZE_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('InitializeConfig instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            admin: instruction.keys[0]!,
            globalConfig: instruction.keys[1]!,
            systemProgram: instruction.keys[2]!,
            program: instruction.keys[3]!,
            programData: instruction.keys[4]!,
        },
        data: getInitializeConfigInstructionDataDecoder().decode(instructionData),
    };
}

export async function createInitializeConfigInstruction(
    accounts: InitializeConfigInstructionAccounts,
    args: InitializeConfigInstructionArgs,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.admin, isSigner: true, isWritable: true },
        { pubkey: globalConfig, isSigner: false, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
        { pubkey: accounts.program, isSigner: false, isWritable: false },
        { pubkey: accounts.programData, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getInitializeConfigInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(INITIALIZE_CONFIG_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
