import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import {
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getI64Decoder,
    getI64Encoder,
    getOptionDecoder,
    getOptionEncoder,
    getStructDecoder,
    getStructEncoder,
    getU16Decoder,
    getU16Encoder,
    transformDecoder,
    transformEncoder,
    type Decoder,
    type Encoder,
    type OptionOrNullable,
} from '@solana/codecs';

export const UPDATE_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR = new Uint8Array([214, 3, 187, 98, 170, 106, 33, 45]);

export interface UpdateProgramConfigInstructionAccounts {
    authority: Address;
    programConfig: Address;
}

export interface UpdateProgramConfigInstructionArgs {
    proposedAuthority: OptionOrNullable<Address>;
    minConsensusThresholdBps: OptionOrNullable<number>;
    tieBreakerAdmin: OptionOrNullable<Address>;
    voteDuration: OptionOrNullable<number | bigint>;
    svmgovProgramPubkey: OptionOrNullable<Address>;
}

function getUpdateProgramConfigInstructionDataEncoder(): Encoder<UpdateProgramConfigInstructionArgs> {
    return getStructEncoder([
        [
            'proposedAuthority',
            getOptionEncoder(
                transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
            ),
        ],
        ['minConsensusThresholdBps', getOptionEncoder(getU16Encoder())],
        [
            'tieBreakerAdmin',
            getOptionEncoder(
                transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
            ),
        ],
        ['voteDuration', getOptionEncoder(getI64Encoder())],
        [
            'svmgovProgramPubkey',
            getOptionEncoder(
                transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
            ),
        ],
    ]);
}

function getUpdateProgramConfigInstructionDataDecoder(): Decoder<UpdateProgramConfigInstructionArgs> {
    return getStructDecoder([
        [
            'proposedAuthority',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['minConsensusThresholdBps', getOptionDecoder(getU16Decoder())],
        [
            'tieBreakerAdmin',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
        ['voteDuration', getOptionDecoder(getI64Decoder())],
        [
            'svmgovProgramPubkey',
            getOptionDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
        ],
    ]);
}

export interface ParsedUpdateProgramConfigInstruction {
    programId: Address;
    accounts: {
        authority: AccountMeta;
        programConfig: AccountMeta;
    };
    data: UpdateProgramConfigInstructionArgs;
}

export function parseUpdateProgramConfigInstruction(
    instruction: TransactionInstruction,
): ParsedUpdateProgramConfigInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for UpdateProgramConfig instruction');
    }
    if (!UPDATE_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('UpdateProgramConfig instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            authority: instruction.keys[0]!,
            programConfig: instruction.keys[1]!,
        },
        data: getUpdateProgramConfigInstructionDataDecoder().decode(instructionData),
    };
}

export function createUpdateProgramConfigInstruction(
    accounts: UpdateProgramConfigInstructionAccounts,
    args: UpdateProgramConfigInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.authority, isSigner: true, isWritable: false },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: true },
    ];
    let data = Buffer.from(getUpdateProgramConfigInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(UPDATE_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
