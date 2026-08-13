import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import {
    fixDecoderSize,
    fixEncoderSize,
    getArrayDecoder,
    getArrayEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getI64Decoder,
    getI64Encoder,
    getStructDecoder,
    getStructEncoder,
    type Decoder,
    type Encoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import { getMetaMerkleLeafDecoder, getMetaMerkleLeafEncoder, type MetaMerkleLeafArgs } from '../types/metaMerkleLeaf';

export const INIT_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR = new Uint8Array([190, 210, 132, 165, 204, 88, 110, 84]);

export interface InitMetaMerkleProofInstructionAccounts {
    payer: Address;
    merkleProof: Address;
    consensusResult: Address;
    systemProgram: Address;
}

export interface InitMetaMerkleProofInstructionArgs {
    metaMerkleLeaf: MetaMerkleLeafArgs;
    metaMerkleProof: Array<ReadonlyUint8Array>;
    closeTimestamp: number | bigint;
}

function getInitMetaMerkleProofInstructionDataEncoder(): Encoder<InitMetaMerkleProofInstructionArgs> {
    return getStructEncoder([
        ['metaMerkleLeaf', getMetaMerkleLeafEncoder()],
        ['metaMerkleProof', getArrayEncoder(fixEncoderSize(getBytesEncoder(), 32))],
        ['closeTimestamp', getI64Encoder()],
    ]);
}

function getInitMetaMerkleProofInstructionDataDecoder(): Decoder<InitMetaMerkleProofInstructionArgs> {
    return getStructDecoder([
        ['metaMerkleLeaf', getMetaMerkleLeafDecoder()],
        ['metaMerkleProof', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 32))],
        ['closeTimestamp', getI64Decoder()],
    ]);
}

export interface ParsedInitMetaMerkleProofInstruction {
    programId: Address;
    accounts: {
        payer: AccountMeta;
        merkleProof: AccountMeta;
        consensusResult: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: InitMetaMerkleProofInstructionArgs;
}

export function parseInitMetaMerkleProofInstruction(
    instruction: TransactionInstruction,
): ParsedInitMetaMerkleProofInstruction {
    if (instruction.keys.length < 4) {
        throw new Error('Expected 4 account metas for InitMetaMerkleProof instruction');
    }
    if (
        !INIT_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)
    ) {
        throw new Error('InitMetaMerkleProof instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            payer: instruction.keys[0]!,
            merkleProof: instruction.keys[1]!,
            consensusResult: instruction.keys[2]!,
            systemProgram: instruction.keys[3]!,
        },
        data: getInitMetaMerkleProofInstructionDataDecoder().decode(instructionData),
    };
}

export function createInitMetaMerkleProofInstruction(
    accounts: InitMetaMerkleProofInstructionAccounts,
    args: InitMetaMerkleProofInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.payer, isSigner: true, isWritable: true },
        { pubkey: accounts.merkleProof, isSigner: false, isWritable: true },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getInitMetaMerkleProofInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(INIT_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
