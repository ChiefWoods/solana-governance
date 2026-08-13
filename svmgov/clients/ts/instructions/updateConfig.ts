import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import {
    getI64Decoder,
    getI64Encoder,
    getOptionDecoder,
    getOptionEncoder,
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
    type OptionOrNullable,
} from '@solana/codecs';

export const UPDATE_CONFIG_INSTRUCTION_DISCRIMINATOR = new Uint8Array([29, 158, 252, 191, 10, 83, 219, 99]);

export interface UpdateConfigInstructionAccounts {
    admin: Address;
    globalConfig?: Address;
    systemProgram: Address;
}

export interface UpdateConfigInstructionArgs {
    maxTitleLength: OptionOrNullable<number>;
    maxDescriptionLength: OptionOrNullable<number>;
    maxSupportEpochs: OptionOrNullable<number | bigint>;
    minProposalStakeLamports: OptionOrNullable<number | bigint>;
    clusterSupportPctMinBps: OptionOrNullable<number | bigint>;
    discussionEpochs: OptionOrNullable<number | bigint>;
    votingEpochs: OptionOrNullable<number | bigint>;
    snapshotEpochExtension: OptionOrNullable<number | bigint>;
    snapshotSlotOffset: OptionOrNullable<number | bigint>;
    maxSupporters: OptionOrNullable<number>;
}

function getUpdateConfigInstructionDataEncoder(): Encoder<UpdateConfigInstructionArgs> {
    return getStructEncoder([
        ['maxTitleLength', getOptionEncoder(getU16Encoder())],
        ['maxDescriptionLength', getOptionEncoder(getU16Encoder())],
        ['maxSupportEpochs', getOptionEncoder(getU64Encoder())],
        ['minProposalStakeLamports', getOptionEncoder(getU64Encoder())],
        ['clusterSupportPctMinBps', getOptionEncoder(getU64Encoder())],
        ['discussionEpochs', getOptionEncoder(getU64Encoder())],
        ['votingEpochs', getOptionEncoder(getU64Encoder())],
        ['snapshotEpochExtension', getOptionEncoder(getU64Encoder())],
        ['snapshotSlotOffset', getOptionEncoder(getI64Encoder())],
        ['maxSupporters', getOptionEncoder(getU32Encoder())],
    ]);
}

function getUpdateConfigInstructionDataDecoder(): Decoder<UpdateConfigInstructionArgs> {
    return getStructDecoder([
        ['maxTitleLength', getOptionDecoder(getU16Decoder())],
        ['maxDescriptionLength', getOptionDecoder(getU16Decoder())],
        ['maxSupportEpochs', getOptionDecoder(getU64Decoder())],
        ['minProposalStakeLamports', getOptionDecoder(getU64Decoder())],
        ['clusterSupportPctMinBps', getOptionDecoder(getU64Decoder())],
        ['discussionEpochs', getOptionDecoder(getU64Decoder())],
        ['votingEpochs', getOptionDecoder(getU64Decoder())],
        ['snapshotEpochExtension', getOptionDecoder(getU64Decoder())],
        ['snapshotSlotOffset', getOptionDecoder(getI64Decoder())],
        ['maxSupporters', getOptionDecoder(getU32Decoder())],
    ]);
}

export interface ParsedUpdateConfigInstruction {
    programId: Address;
    accounts: {
        admin: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: UpdateConfigInstructionArgs;
}

export function parseUpdateConfigInstruction(instruction: TransactionInstruction): ParsedUpdateConfigInstruction {
    if (instruction.keys.length < 3) {
        throw new Error('Expected 3 account metas for UpdateConfig instruction');
    }
    if (!UPDATE_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('UpdateConfig instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            admin: instruction.keys[0]!,
            globalConfig: instruction.keys[1]!,
            systemProgram: instruction.keys[2]!,
        },
        data: getUpdateConfigInstructionDataDecoder().decode(instructionData),
    };
}

export async function createUpdateConfigInstruction(
    accounts: UpdateConfigInstructionAccounts,
    args: UpdateConfigInstructionArgs,
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
    ];
    let data = Buffer.from(getUpdateConfigInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(UPDATE_CONFIG_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
