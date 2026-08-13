import { AccountMeta, Address, Keypair, TransactionInstruction } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';
import { findBallotBoxPda } from '../pdas/ballotBox';
import {
    fixDecoderSize,
    fixEncoderSize,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    transformDecoder,
    transformEncoder,
    type Decoder,
    type Encoder,
} from '@solana/codecs';

export const INIT_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR = new Uint8Array([164, 20, 45, 213, 67, 43, 193, 212]);

export interface InitBallotBoxInstructionAccounts {
    payer: Address;
    proposal: Address;
    ballotBox?: Address;
    programConfig: Address;
    systemProgram: Address;
}

export interface InitBallotBoxInstructionArgs {
    snapshotSlot: number | bigint;
    proposalSeed: number | bigint;
    splVoteAccount: Address;
}

function getInitBallotBoxInstructionDataEncoder(): Encoder<InitBallotBoxInstructionArgs> {
    return getStructEncoder([
        ['snapshotSlot', getU64Encoder()],
        ['proposalSeed', getU64Encoder()],
        [
            'splVoteAccount',
            transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (value: Address) => value.toBytes()),
        ],
    ]);
}

function getInitBallotBoxInstructionDataDecoder(): Decoder<InitBallotBoxInstructionArgs> {
    return getStructDecoder([
        ['snapshotSlot', getU64Decoder()],
        ['proposalSeed', getU64Decoder()],
        ['splVoteAccount', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
    ]);
}

export interface ParsedInitBallotBoxInstruction {
    programId: Address;
    accounts: {
        payer: AccountMeta;
        proposal: AccountMeta;
        ballotBox: AccountMeta;
        programConfig: AccountMeta;
        systemProgram: AccountMeta;
    };
    data: InitBallotBoxInstructionArgs;
}

export function parseInitBallotBoxInstruction(instruction: TransactionInstruction): ParsedInitBallotBoxInstruction {
    if (instruction.keys.length < 5) {
        throw new Error('Expected 5 account metas for InitBallotBox instruction');
    }
    if (!INIT_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => instruction.data[0 + index] === byte)) {
        throw new Error('InitBallotBox instruction discriminator mismatch');
    }
    const instructionData = instruction.data.subarray(8);
    return {
        programId: instruction.programId,
        accounts: {
            payer: instruction.keys[0]!,
            proposal: instruction.keys[1]!,
            ballotBox: instruction.keys[2]!,
            programConfig: instruction.keys[3]!,
            systemProgram: instruction.keys[4]!,
        },
        data: getInitBallotBoxInstructionDataDecoder().decode(instructionData),
    };
}

export async function createInitBallotBoxInstruction(
    accounts: InitBallotBoxInstructionAccounts,
    args: InitBallotBoxInstructionArgs,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): Promise<TransactionInstruction> {
    let ballotBox = accounts.ballotBox;
    if (!ballotBox) {
        const [derived] = await findBallotBoxPda(
            {
                snapshotSlot: args.snapshotSlot,
            },
            programId,
        );
        ballotBox = derived;
    }
    const keys: AccountMeta[] = [
        { pubkey: accounts.payer, isSigner: true, isWritable: true },
        { pubkey: accounts.proposal, isSigner: true, isWritable: false },
        { pubkey: ballotBox, isSigner: false, isWritable: true },
        { pubkey: accounts.programConfig, isSigner: false, isWritable: false },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    ];
    let data = Buffer.from(getInitBallotBoxInstructionDataEncoder().encode(args));
    data = Buffer.concat([
        data.subarray(0, 0),
        Buffer.alloc(Math.max(0, 0 - data.length)),
        Buffer.from(INIT_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR),
        data.subarray(0),
    ]);

    return new TransactionInstruction({ keys, programId, data });
}
