import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import { findProgramConfigPda } from '../pdas/programConfig';
import { findSupportPda } from '../pdas/support';

export const SUPPORT_PROPOSAL_INSTRUCTION_DISCRIMINATOR = new Uint8Array([95, 239, 233, 199, 201, 62, 90, 27]);

export interface SupportProposalInstructionAccounts {
    signer: Address;
    proposal: Address;
    support?: Address;
    splVoteAccount: Address;
    ballotBox: Address;
    ballotProgram: Address;
    programConfig?: Address;
    globalConfig?: Address;
    systemProgram: Address;
}

export interface ParsedSupportProposalInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        support: AccountMeta;
        splVoteAccount: AccountMeta;
        ballotBox: AccountMeta;
        ballotProgram: AccountMeta;
        programConfig: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseSupportProposalInstruction(instruction: TransactionInstruction): ParsedSupportProposalInstruction {
    if (instruction.keys.length < 9) {
        throw new Error('Expected 9 account metas for SupportProposal instruction');
    }
    if (!SUPPORT_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('SupportProposal instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            support: instruction.keys[2]!,
            splVoteAccount: instruction.keys[3]!,
            ballotBox: instruction.keys[4]!,
            ballotProgram: instruction.keys[5]!,
            programConfig: instruction.keys[6]!,
            globalConfig: instruction.keys[7]!,
            systemProgram: instruction.keys[8]!,
        },
        data: {},
    };
}

export async function createSupportProposalInstruction(
    accounts: SupportProposalInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let support = accounts.support;
    if (!support) {
        const [derived] = await findSupportPda(
            {
                proposal: accounts.proposal,
                splVoteAccount: accounts.splVoteAccount,
            },
            programId,
        );
        support = derived;
    }
    let programConfig = accounts.programConfig;
    if (!programConfig) {
        const [derived] = await findProgramConfigPda(programId);
        programConfig = derived;
    }
    let globalConfig = accounts.globalConfig;
    if (!globalConfig) {
        const [derived] = await findGlobalConfigPda(programId);
        globalConfig = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.signer, isSigner: true, isWritable: true },
        { pubkey: accounts.proposal, isSigner: false, isWritable: true },
        { pubkey: support, isSigner: false, isWritable: true },
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: true },
        { pubkey: accounts.ballotProgram, isSigner: false, isWritable: false },
        { pubkey: programConfig, isSigner: false, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(SUPPORT_PROPOSAL_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
