import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';
import { findGlobalConfigPda } from '../pdas/globalConfig';
import { findProgramConfigPda } from '../pdas/programConfig';

export const FLUSH_MERKLE_ROOT_INSTRUCTION_DISCRIMINATOR = new Uint8Array([10, 71, 17, 246, 162, 57, 144, 87]);

export interface FlushMerkleRootInstructionAccounts {
    signer: Address;
    proposal: Address;
    splVoteAccount: Address;
    ballotBox: Address;
    ballotProgram: Address;
    programConfig?: Address;
    globalConfig?: Address;
    systemProgram: Address;
}

export interface ParsedFlushMerkleRootInstruction {
    programId: Address;
    accounts: {
        signer: AccountMeta;
        proposal: AccountMeta;
        splVoteAccount: AccountMeta;
        ballotBox: AccountMeta;
        ballotProgram: AccountMeta;
        programConfig: AccountMeta;
        globalConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: {};
}

export function parseFlushMerkleRootInstruction(instruction: TransactionInstruction): ParsedFlushMerkleRootInstruction {
    if (instruction.keys.length < 8) {
        throw new Error('Expected 8 account metas for FlushMerkleRoot instruction');
    }
    if (!FLUSH_MERKLE_ROOT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('FlushMerkleRoot instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            signer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            splVoteAccount: instruction.keys[2]!,
            ballotBox: instruction.keys[3]!,
            ballotProgram: instruction.keys[4]!,
            programConfig: instruction.keys[5]!,
            globalConfig: instruction.keys[6]!,
            systemProgram: instruction.keys[7]!,
        },
        data: {},
    };
}

export async function createFlushMerkleRootInstruction(
    accounts: FlushMerkleRootInstructionAccounts,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<TransactionInstruction> {
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
        { pubkey: accounts.splVoteAccount, isSigner: false, isWritable: false },
        { pubkey: accounts.ballotBox, isSigner: false, isWritable: false },
        { pubkey: accounts.ballotProgram, isSigner: false, isWritable: false },
        { pubkey: programConfig, isSigner: false, isWritable: false },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.alloc(0);
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(FLUSH_MERKLE_ROOT_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
