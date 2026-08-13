import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import {
    addDecoderSizePrefix,
    addEncoderSizePrefix,
    getStructDecoder,
    getStructEncoder,
    getU32Decoder,
    getU32Encoder,
    getU64Decoder,
    getU64Encoder,
    getUtf8Decoder,
    getUtf8Encoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import { findProposalIndexPda } from '../pdas/proposalIndex';
import { findProposalPda } from '../pdas/proposal';

export const CREATE_PROPOSAL_INSTRUCTION_DISCRIMINATOR = new Uint8Array([132, 116, 68, 174, 216, 160, 198, 22]);

export interface CreateProposalInstructionAccounts {
    signer: Address;
    proposal?: Address;
    proposalIndex?: Address;
    splVoteAccount: Address;
    globalConfig?: Address;
    systemProgram: Address;
}

export interface CreateProposalInstructionArgs {
    seed: number | bigint;
    title: string;
    description: string;
}

function getCreateProposalInstructionDataEncoder(): Encoder<CreateProposalInstructionArgs> {
    return getStructEncoder([
        ['seed', getU64Encoder()],
        ['title', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
        ['description', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
    ]);
}

function getCreateProposalInstructionDataDecoder(): Decoder<CreateProposalInstructionArgs> {
    return getStructDecoder([
        ['seed', getU64Decoder()],
        ['title', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ['description', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ]);
}

export interface ParsedCreateProposalInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        proposalIndex: AccountMeta;
        splVoteAccount: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: CreateProposalInstructionArgs;
}

export function parseCreateProposalInstruction(instruction: TransactionInstruction): ParsedCreateProposalInstruction {
    if (instruction.keys.length < 6) {
        throw new Error('Expected 6 account metas for CreateProposal instruction');
    }
    if (!CREATE_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('CreateProposal instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            proposalIndex: instruction.keys[2]!,
            splVoteAccount: instruction.keys[3]!,
            globalConfig: instruction.keys[4]!,
            systemProgram: instruction.keys[5]!,
        },
        data: getCreateProposalInstructionDataDecoder().decode(instructionData),
    };
}

export async function createCreateProposalInstruction(
    accounts: CreateProposalInstructionAccounts,
    args: CreateProposalInstructionArgs,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let proposal = accounts.proposal;
    if (!proposal) {
        const [derived] = await findProposalPda(
            {
                seed: args.seed,
                splVoteAccount: accounts.splVoteAccount,
            },
            programId,
        );
        proposal = derived;
    }
    let proposalIndex = accounts.proposalIndex;
    if (!proposalIndex) {
        const [derived] = await findProposalIndexPda(programId);
        proposalIndex = derived;
    }
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: proposal, isSigner: false, isWritable: true },
        { pubkey: proposalIndex, isSigner: false, isWritable: true },
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getCreateProposalInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(CREATE_PROPOSAL_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
