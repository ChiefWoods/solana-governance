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
    type Decoder,
    type Encoder,
    type OptionOrNullable,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import {
    getStakeMerkleLeafDecoder,
    getStakeMerkleLeafEncoder,
    type StakeMerkleLeafArgs,
} from '../types/stakeMerkleLeaf';

export const VERIFY_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR = new Uint8Array([51, 191, 37, 169, 74, 207, 201, 102]);

export interface VerifyMerkleProofInstructionAccounts {
    metaMerkleProof: Address;
    consensusResult: Address;
}

export interface VerifyMerkleProofInstructionArgs {
    stakeMerkleProof: OptionOrNullable<Array<ReadonlyUint8Array>>;
    stakeMerkleLeaf: OptionOrNullable<StakeMerkleLeafArgs>;
}

function getVerifyMerkleProofInstructionDataEncoder(): Encoder<VerifyMerkleProofInstructionArgs> {
    return getStructEncoder([
        ['stakeMerkleProof', getOptionEncoder(getArrayEncoder(fixEncoderSize(getBytesEncoder(), 32)))],
        ['stakeMerkleLeaf', getOptionEncoder(getStakeMerkleLeafEncoder())],
    ]);
}

function getVerifyMerkleProofInstructionDataDecoder(): Decoder<VerifyMerkleProofInstructionArgs> {
    return getStructDecoder([
        ['stakeMerkleProof', getOptionDecoder(getArrayDecoder(fixDecoderSize(getBytesDecoder(), 32)))],
        ['stakeMerkleLeaf', getOptionDecoder(getStakeMerkleLeafDecoder())],
    ]);
}

export interface ParsedVerifyMerkleProofInstruction {
    programId: Address;
    accounts: {
        metaMerkleProof: AccountMeta;
        consensusResult: AccountMeta;
    };
    data: VerifyMerkleProofInstructionArgs;
}

export function parseVerifyMerkleProofInstruction(
    instruction: TransactionInstruction,
): ParsedVerifyMerkleProofInstruction {
    if (instruction.keys.length < 2) {
        throw new Error('Expected 2 account metas for VerifyMerkleProof instruction');
    }
    if (!VERIFY_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('VerifyMerkleProof instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            metaMerkleProof: instruction.keys[0]!,
            consensusResult: instruction.keys[1]!,
        },
        data: getVerifyMerkleProofInstructionDataDecoder().decode(instructionData),
    };
}

export function createVerifyMerkleProofInstruction(
    accounts: VerifyMerkleProofInstructionAccounts,
    args: VerifyMerkleProofInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): TransactionInstruction {
    const keys: AccountMeta[] = [
        { pubkey: accounts.metaMerkleProof, isSigner: false, isWritable: false },
        { pubkey: accounts.consensusResult, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getVerifyMerkleProofInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(VERIFY_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
