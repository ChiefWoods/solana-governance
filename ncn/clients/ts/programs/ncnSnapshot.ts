import { Address, TransactionInstruction } from '@solana/web3.js';
import { BALLOT_BOX_ACCOUNT_DISCRIMINATOR } from '../accounts/ballotBox';
import {
    CAST_VOTE_INSTRUCTION_DISCRIMINATOR,
    parseCastVoteInstruction,
    type ParsedCastVoteInstruction,
} from '../instructions/castVote';
import {
    CLOSE_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR,
    parseCloseMetaMerkleProofInstruction,
    type ParsedCloseMetaMerkleProofInstruction,
} from '../instructions/closeMetaMerkleProof';
import { CONSENSUS_RESULT_ACCOUNT_DISCRIMINATOR } from '../accounts/consensusResult';
import {
    FINALIZE_BALLOT_INSTRUCTION_DISCRIMINATOR,
    parseFinalizeBallotInstruction,
    type ParsedFinalizeBallotInstruction,
} from '../instructions/finalizeBallot';
import {
    FINALIZE_PROPOSED_AUTHORITY_INSTRUCTION_DISCRIMINATOR,
    parseFinalizeProposedAuthorityInstruction,
    type ParsedFinalizeProposedAuthorityInstruction,
} from '../instructions/finalizeProposedAuthority';
import {
    INIT_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR,
    parseInitBallotBoxInstruction,
    type ParsedInitBallotBoxInstruction,
} from '../instructions/initBallotBox';
import {
    INIT_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR,
    parseInitMetaMerkleProofInstruction,
    type ParsedInitMetaMerkleProofInstruction,
} from '../instructions/initMetaMerkleProof';
import {
    INIT_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR,
    parseInitProgramConfigInstruction,
    type ParsedInitProgramConfigInstruction,
} from '../instructions/initProgramConfig';
import { META_MERKLE_PROOF_ACCOUNT_DISCRIMINATOR } from '../accounts/metaMerkleProof';
import { PROGRAM_CONFIG_ACCOUNT_DISCRIMINATOR } from '../accounts/programConfig';
import {
    REMOVE_VOTE_INSTRUCTION_DISCRIMINATOR,
    parseRemoveVoteInstruction,
    type ParsedRemoveVoteInstruction,
} from '../instructions/removeVote';
import {
    RESET_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR,
    parseResetBallotBoxInstruction,
    type ParsedResetBallotBoxInstruction,
} from '../instructions/resetBallotBox';
import {
    SET_TIE_BREAKER_INSTRUCTION_DISCRIMINATOR,
    parseSetTieBreakerInstruction,
    type ParsedSetTieBreakerInstruction,
} from '../instructions/setTieBreaker';
import {
    UPDATE_OPERATOR_WHITELIST_INSTRUCTION_DISCRIMINATOR,
    parseUpdateOperatorWhitelistInstruction,
    type ParsedUpdateOperatorWhitelistInstruction,
} from '../instructions/updateOperatorWhitelist';
import {
    UPDATE_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR,
    parseUpdateProgramConfigInstruction,
    type ParsedUpdateProgramConfigInstruction,
} from '../instructions/updateProgramConfig';
import {
    VERIFY_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR,
    parseVerifyMerkleProofInstruction,
    type ParsedVerifyMerkleProofInstruction,
} from '../instructions/verifyMerkleProof';

export const NCNSNAPSHOT_PROGRAM_ID = new Address('ncnwF8AgynRcdEnGLcprSQNaKvgSMTgk3yPRc8cf9Zf');
export const NCN_SNAPSHOT_PROGRAM_ADDRESS = NCNSNAPSHOT_PROGRAM_ID;

export interface NcnSnapshotProgram {
    name: 'ncnSnapshot';
    programId: Address;
}

export function getNcnSnapshotProgram(programId: Address = NCNSNAPSHOT_PROGRAM_ID): NcnSnapshotProgram {
    return { name: 'ncnSnapshot', programId };
}

export enum NcnSnapshotAccount {
    BallotBox,
    ConsensusResult,
    MetaMerkleProof,
    ProgramConfig,
}

export function identifyNcnSnapshotAccount(account: { data: Uint8Array } | Uint8Array): NcnSnapshotAccount {
    const data = account instanceof Uint8Array ? account : account.data;
    if (BALLOT_BOX_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotAccount.BallotBox;
    if (CONSENSUS_RESULT_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotAccount.ConsensusResult;
    if (META_MERKLE_PROOF_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotAccount.MetaMerkleProof;
    if (PROGRAM_CONFIG_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotAccount.ProgramConfig;
    throw new Error('Failed to identify NcnSnapshot account');
}

export enum NcnSnapshotInstruction {
    CastVote,
    CloseMetaMerkleProof,
    FinalizeBallot,
    FinalizeProposedAuthority,
    InitBallotBox,
    InitMetaMerkleProof,
    InitProgramConfig,
    RemoveVote,
    ResetBallotBox,
    SetTieBreaker,
    UpdateOperatorWhitelist,
    UpdateProgramConfig,
    VerifyMerkleProof,
}

export function identifyNcnSnapshotInstruction(instruction: { data: Uint8Array } | Uint8Array): NcnSnapshotInstruction {
    const data = instruction instanceof Uint8Array ? instruction : instruction.data;
    if (CAST_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.CastVote;
    if (CLOSE_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.CloseMetaMerkleProof;
    if (FINALIZE_BALLOT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.FinalizeBallot;
    if (FINALIZE_PROPOSED_AUTHORITY_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.FinalizeProposedAuthority;
    if (INIT_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.InitBallotBox;
    if (INIT_META_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.InitMetaMerkleProof;
    if (INIT_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.InitProgramConfig;
    if (REMOVE_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.RemoveVote;
    if (RESET_BALLOT_BOX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.ResetBallotBox;
    if (SET_TIE_BREAKER_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.SetTieBreaker;
    if (UPDATE_OPERATOR_WHITELIST_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.UpdateOperatorWhitelist;
    if (UPDATE_PROGRAM_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.UpdateProgramConfig;
    if (VERIFY_MERKLE_PROOF_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return NcnSnapshotInstruction.VerifyMerkleProof;
    throw new Error('Failed to identify NcnSnapshot instruction');
}

export type ParsedNcnSnapshotInstruction =
    | ({ instructionType: NcnSnapshotInstruction.CastVote } & ParsedCastVoteInstruction)
    | ({ instructionType: NcnSnapshotInstruction.CloseMetaMerkleProof } & ParsedCloseMetaMerkleProofInstruction)
    | ({ instructionType: NcnSnapshotInstruction.FinalizeBallot } & ParsedFinalizeBallotInstruction)
    | ({
          instructionType: NcnSnapshotInstruction.FinalizeProposedAuthority;
      } & ParsedFinalizeProposedAuthorityInstruction)
    | ({ instructionType: NcnSnapshotInstruction.InitBallotBox } & ParsedInitBallotBoxInstruction)
    | ({ instructionType: NcnSnapshotInstruction.InitMetaMerkleProof } & ParsedInitMetaMerkleProofInstruction)
    | ({ instructionType: NcnSnapshotInstruction.InitProgramConfig } & ParsedInitProgramConfigInstruction)
    | ({ instructionType: NcnSnapshotInstruction.RemoveVote } & ParsedRemoveVoteInstruction)
    | ({ instructionType: NcnSnapshotInstruction.ResetBallotBox } & ParsedResetBallotBoxInstruction)
    | ({ instructionType: NcnSnapshotInstruction.SetTieBreaker } & ParsedSetTieBreakerInstruction)
    | ({ instructionType: NcnSnapshotInstruction.UpdateOperatorWhitelist } & ParsedUpdateOperatorWhitelistInstruction)
    | ({ instructionType: NcnSnapshotInstruction.UpdateProgramConfig } & ParsedUpdateProgramConfigInstruction)
    | ({ instructionType: NcnSnapshotInstruction.VerifyMerkleProof } & ParsedVerifyMerkleProofInstruction);

export function parseNcnSnapshotInstruction(instruction: TransactionInstruction): ParsedNcnSnapshotInstruction {
    const instructionType = identifyNcnSnapshotInstruction(instruction);
    switch (instructionType) {
        case NcnSnapshotInstruction.CastVote:
            return {
                instructionType,
                ...parseCastVoteInstruction(instruction),
            };
        case NcnSnapshotInstruction.CloseMetaMerkleProof:
            return {
                instructionType,
                ...parseCloseMetaMerkleProofInstruction(instruction),
            };
        case NcnSnapshotInstruction.FinalizeBallot:
            return {
                instructionType,
                ...parseFinalizeBallotInstruction(instruction),
            };
        case NcnSnapshotInstruction.FinalizeProposedAuthority:
            return {
                instructionType,
                ...parseFinalizeProposedAuthorityInstruction(instruction),
            };
        case NcnSnapshotInstruction.InitBallotBox:
            return {
                instructionType,
                ...parseInitBallotBoxInstruction(instruction),
            };
        case NcnSnapshotInstruction.InitMetaMerkleProof:
            return {
                instructionType,
                ...parseInitMetaMerkleProofInstruction(instruction),
            };
        case NcnSnapshotInstruction.InitProgramConfig:
            return {
                instructionType,
                ...parseInitProgramConfigInstruction(instruction),
            };
        case NcnSnapshotInstruction.RemoveVote:
            return {
                instructionType,
                ...parseRemoveVoteInstruction(instruction),
            };
        case NcnSnapshotInstruction.ResetBallotBox:
            return {
                instructionType,
                ...parseResetBallotBoxInstruction(instruction),
            };
        case NcnSnapshotInstruction.SetTieBreaker:
            return {
                instructionType,
                ...parseSetTieBreakerInstruction(instruction),
            };
        case NcnSnapshotInstruction.UpdateOperatorWhitelist:
            return {
                instructionType,
                ...parseUpdateOperatorWhitelistInstruction(instruction),
            };
        case NcnSnapshotInstruction.UpdateProgramConfig:
            return {
                instructionType,
                ...parseUpdateProgramConfigInstruction(instruction),
            };
        case NcnSnapshotInstruction.VerifyMerkleProof:
            return {
                instructionType,
                ...parseVerifyMerkleProofInstruction(instruction),
            };
    }
}
