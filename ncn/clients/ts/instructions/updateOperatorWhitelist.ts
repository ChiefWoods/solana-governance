import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import {
    fixDecoderSize,
    fixEncoderSize,
    getArrayDecoder,
    getArrayEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getOptionDecoder,
    getOptionEncoder,
    getStructDecoder,
    getStructEncoder,
    transformDecoder,
    transformEncoder,
    type Decoder,
    type Encoder,
    type OptionOrNullable,
} from '@solana/codecs';

export const UPDATE_OPERATOR_WHITELIST_INSTRUCTION_DISCRIMINATOR = new Uint8Array([
    25, 65, 144, 150, 200, 245, 156, 92,
]);

export interface UpdateOperatorWhitelistInstructionAccounts {
    authority: Address;
    programConfig: Address;
}

export interface UpdateOperatorWhitelistInstructionArgs {
    operatorsToAdd: OptionOrNullable<Array<Address>>;
    operatorsToRemove: OptionOrNullable<Array<Address>>;
}

function getUpdateOperatorWhitelistInstructionDataEncoder(): Encoder<UpdateOperatorWhitelistInstructionArgs> {
    return getStructEncoder([
        [
            'operatorsToAdd',
            getOptionEncoder(
                getArrayEncoder(
                    transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
                ),
            ),
        ],
        [
            'operatorsToRemove',
            getOptionEncoder(
                getArrayEncoder(
                    transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
                ),
            ),
        ],
    ]);
}

function getUpdateOperatorWhitelistInstructionDataDecoder(): Decoder<UpdateOperatorWhitelistInstructionArgs> {
    return getStructDecoder([
        [
            'operatorsToAdd',
            getOptionDecoder(
                getArrayDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
            ),
        ],
        [
            'operatorsToRemove',
            getOptionDecoder(
                getArrayDecoder(transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))),
            ),
        ],
    ]);
}

export interface ParsedUpdateOperatorWhitelistInstruction {
    programId: Address;
    accounts: {
        authority: AccountMeta;
        programConfig: AccountMeta;
    };
    data: UpdateOperatorWhitelistInstructionArgs;
}

export function parseUpdateOperatorWhitelistInstruction(
    instruction: TransactionInstruction,
): ParsedUpdateOperatorWhitelistInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for UpdateOperatorWhitelist instruction');
    }
    if (
        !UPDATE_OPERATOR_WHITELIST_INSTRUCTION_DISCRIMINATOR.every(
            (byte, index) => instruction.data[0 + index] === byte,
        )
    ) {
        throw new Error('UpdateOperatorWhitelist instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            authority: instruction.keys[0]!,
            programConfig: instruction.keys[1]!,
        },
        data: getUpdateOperatorWhitelistInstructionDataDecoder().decode(instructionData),
    };
}

export function createUpdateOperatorWhitelistInstruction(
    accounts: UpdateOperatorWhitelistInstructionAccounts,
    args: UpdateOperatorWhitelistInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.authority, isSigner: true, isWritable: false },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: true },
    ];
    let data = Buffer.from(getUpdateOperatorWhitelistInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(UPDATE_OPERATOR_WHITELIST_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
