import {
    ACCEPT_ADMIN_INSTRUCTION_DISCRIMINATOR,
    parseAcceptAdminInstruction,
    type ParsedAcceptAdminInstruction,
} from '../instructions/acceptAdmin';
import { Address, TransactionInstruction } from '@solana/web3.js';
import {
    CAST_VOTE_INSTRUCTION_DISCRIMINATOR,
    parseCastVoteInstruction,
    type ParsedCastVoteInstruction,
} from '../instructions/castVote';
import {
    CAST_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR,
    parseCastVoteOverrideInstruction,
    type ParsedCastVoteOverrideInstruction,
} from '../instructions/castVoteOverride';
import {
    CREATE_PROPOSAL_INSTRUCTION_DISCRIMINATOR,
    parseCreateProposalInstruction,
    type ParsedCreateProposalInstruction,
} from '../instructions/createProposal';
import {
    FINALIZE_PROPOSAL_INSTRUCTION_DISCRIMINATOR,
    parseFinalizeProposalInstruction,
    type ParsedFinalizeProposalInstruction,
} from '../instructions/finalizeProposal';
import {
    FLUSH_MERKLE_ROOT_INSTRUCTION_DISCRIMINATOR,
    parseFlushMerkleRootInstruction,
    type ParsedFlushMerkleRootInstruction,
} from '../instructions/flushMerkleRoot';
import { GLOBAL_CONFIG_ACCOUNT_DISCRIMINATOR } from '../accounts/globalConfig';
import {
    INITIALIZE_CONFIG_INSTRUCTION_DISCRIMINATOR,
    parseInitializeConfigInstruction,
    type ParsedInitializeConfigInstruction,
} from '../instructions/initializeConfig';
import {
    INITIALIZE_INDEX_INSTRUCTION_DISCRIMINATOR,
    parseInitializeIndexInstruction,
    type ParsedInitializeIndexInstruction,
} from '../instructions/initializeIndex';
import {
    MODIFY_VOTE_INSTRUCTION_DISCRIMINATOR,
    parseModifyVoteInstruction,
    type ParsedModifyVoteInstruction,
} from '../instructions/modifyVote';
import {
    MODIFY_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR,
    parseModifyVoteOverrideInstruction,
    type ParsedModifyVoteOverrideInstruction,
} from '../instructions/modifyVoteOverride';
import {
    NOMINATE_ADMIN_INSTRUCTION_DISCRIMINATOR,
    parseNominateAdminInstruction,
    type ParsedNominateAdminInstruction,
} from '../instructions/nominateAdmin';
import { PROPOSAL_ACCOUNT_DISCRIMINATOR } from '../accounts/proposal';
import { PROPOSAL_INDEX_ACCOUNT_DISCRIMINATOR } from '../accounts/proposalIndex';
import {
    RETALLY_SUPPORT_INSTRUCTION_DISCRIMINATOR,
    parseRetallySupportInstruction,
    type ParsedRetallySupportInstruction,
} from '../instructions/retallySupport';
import { SUPPORT_ACCOUNT_DISCRIMINATOR } from '../accounts/support';
import {
    SUPPORT_PROPOSAL_INSTRUCTION_DISCRIMINATOR,
    parseSupportProposalInstruction,
    type ParsedSupportProposalInstruction,
} from '../instructions/supportProposal';
import {
    UPDATE_CONFIG_INSTRUCTION_DISCRIMINATOR,
    parseUpdateConfigInstruction,
    type ParsedUpdateConfigInstruction,
} from '../instructions/updateConfig';
import { VOTE_ACCOUNT_DISCRIMINATOR } from '../accounts/vote';
import { VOTE_OVERRIDE_ACCOUNT_DISCRIMINATOR } from '../accounts/voteOverride';
import { VOTE_OVERRIDE_CACHE_ACCOUNT_DISCRIMINATOR } from '../accounts/voteOverrideCache';

export const SVMGOVPROGRAM_PROGRAM_ID = new Address('govYkyQ3ePtGULAtY6V75qjWE8UH4vCUVQ1W4HdCAZU');
export const SVMGOV_PROGRAM_PROGRAM_ADDRESS = SVMGOVPROGRAM_PROGRAM_ID;

export interface SvmgovProgramProgram {
    name: 'svmgovProgram';
    programId: Address;
}

export function getSvmgovProgramProgram(programId: Address = SVMGOVPROGRAM_PROGRAM_ID): SvmgovProgramProgram {
    return { name: 'svmgovProgram', programId };
}

export enum SvmgovProgramAccount {
    GlobalConfig,
    Proposal,
    ProposalIndex,
    Support,
    Vote,
    VoteOverride,
    VoteOverrideCache,
}

export function identifySvmgovProgramAccount(account: { data: Uint8Array } | Uint8Array): SvmgovProgramAccount {
    const data = account instanceof Uint8Array ? account : account.data;
    if (GLOBAL_CONFIG_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.GlobalConfig;
    if (PROPOSAL_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.Proposal;
    if (PROPOSAL_INDEX_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.ProposalIndex;
    if (SUPPORT_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.Support;
    if (VOTE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) return SvmgovProgramAccount.Vote;
    if (VOTE_OVERRIDE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.VoteOverride;
    if (VOTE_OVERRIDE_CACHE_ACCOUNT_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramAccount.VoteOverrideCache;
    throw new Error('Failed to identify SvmgovProgram account');
}

export enum SvmgovProgramInstruction {
    AcceptAdmin,
    CastVote,
    CastVoteOverride,
    CreateProposal,
    FinalizeProposal,
    FlushMerkleRoot,
    InitializeConfig,
    InitializeIndex,
    ModifyVote,
    ModifyVoteOverride,
    NominateAdmin,
    RetallySupport,
    SupportProposal,
    UpdateConfig,
}

export function identifySvmgovProgramInstruction(
    instruction: { data: Uint8Array } | Uint8Array,
): SvmgovProgramInstruction {
    const data = instruction instanceof Uint8Array ? instruction : instruction.data;
    if (ACCEPT_ADMIN_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.AcceptAdmin;
    if (CAST_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.CastVote;
    if (CAST_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.CastVoteOverride;
    if (CREATE_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.CreateProposal;
    if (FINALIZE_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.FinalizeProposal;
    if (FLUSH_MERKLE_ROOT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.FlushMerkleRoot;
    if (INITIALIZE_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.InitializeConfig;
    if (INITIALIZE_INDEX_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.InitializeIndex;
    if (MODIFY_VOTE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.ModifyVote;
    if (MODIFY_VOTE_OVERRIDE_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.ModifyVoteOverride;
    if (NOMINATE_ADMIN_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.NominateAdmin;
    if (RETALLY_SUPPORT_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.RetallySupport;
    if (SUPPORT_PROPOSAL_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.SupportProposal;
    if (UPDATE_CONFIG_INSTRUCTION_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte))
        return SvmgovProgramInstruction.UpdateConfig;
    throw new Error('Failed to identify SvmgovProgram instruction');
}

export type ParsedSvmgovProgramInstruction =
    | ({ instructionType: SvmgovProgramInstruction.AcceptAdmin } & ParsedAcceptAdminInstruction)
    | ({ instructionType: SvmgovProgramInstruction.CastVote } & ParsedCastVoteInstruction)
    | ({ instructionType: SvmgovProgramInstruction.CastVoteOverride } & ParsedCastVoteOverrideInstruction)
    | ({ instructionType: SvmgovProgramInstruction.CreateProposal } & ParsedCreateProposalInstruction)
    | ({ instructionType: SvmgovProgramInstruction.FinalizeProposal } & ParsedFinalizeProposalInstruction)
    | ({ instructionType: SvmgovProgramInstruction.FlushMerkleRoot } & ParsedFlushMerkleRootInstruction)
    | ({ instructionType: SvmgovProgramInstruction.InitializeConfig } & ParsedInitializeConfigInstruction)
    | ({ instructionType: SvmgovProgramInstruction.InitializeIndex } & ParsedInitializeIndexInstruction)
    | ({ instructionType: SvmgovProgramInstruction.ModifyVote } & ParsedModifyVoteInstruction)
    | ({ instructionType: SvmgovProgramInstruction.ModifyVoteOverride } & ParsedModifyVoteOverrideInstruction)
    | ({ instructionType: SvmgovProgramInstruction.NominateAdmin } & ParsedNominateAdminInstruction)
    | ({ instructionType: SvmgovProgramInstruction.RetallySupport } & ParsedRetallySupportInstruction)
    | ({ instructionType: SvmgovProgramInstruction.SupportProposal } & ParsedSupportProposalInstruction)
    | ({ instructionType: SvmgovProgramInstruction.UpdateConfig } & ParsedUpdateConfigInstruction);

export function parseSvmgovProgramInstruction(instruction: TransactionInstruction): ParsedSvmgovProgramInstruction {
    const instructionType = identifySvmgovProgramInstruction(instruction);
    switch (instructionType) {
        case SvmgovProgramInstruction.AcceptAdmin:
            return {
                instructionType,
                ...parseAcceptAdminInstruction(instruction),
            };
        case SvmgovProgramInstruction.CastVote:
            return {
                instructionType,
                ...parseCastVoteInstruction(instruction),
            };
        case SvmgovProgramInstruction.CastVoteOverride:
            return {
                instructionType,
                ...parseCastVoteOverrideInstruction(instruction),
            };
        case SvmgovProgramInstruction.CreateProposal:
            return {
                instructionType,
                ...parseCreateProposalInstruction(instruction),
            };
        case SvmgovProgramInstruction.FinalizeProposal:
            return {
                instructionType,
                ...parseFinalizeProposalInstruction(instruction),
            };
        case SvmgovProgramInstruction.FlushMerkleRoot:
            return {
                instructionType,
                ...parseFlushMerkleRootInstruction(instruction),
            };
        case SvmgovProgramInstruction.InitializeConfig:
            return {
                instructionType,
                ...parseInitializeConfigInstruction(instruction),
            };
        case SvmgovProgramInstruction.InitializeIndex:
            return {
                instructionType,
                ...parseInitializeIndexInstruction(instruction),
            };
        case SvmgovProgramInstruction.ModifyVote:
            return {
                instructionType,
                ...parseModifyVoteInstruction(instruction),
            };
        case SvmgovProgramInstruction.ModifyVoteOverride:
            return {
                instructionType,
                ...parseModifyVoteOverrideInstruction(instruction),
            };
        case SvmgovProgramInstruction.NominateAdmin:
            return {
                instructionType,
                ...parseNominateAdminInstruction(instruction),
            };
        case SvmgovProgramInstruction.RetallySupport:
            return {
                instructionType,
                ...parseRetallySupportInstruction(instruction),
            };
        case SvmgovProgramInstruction.SupportProposal:
            return {
                instructionType,
                ...parseSupportProposalInstruction(instruction),
            };
        case SvmgovProgramInstruction.UpdateConfig:
            return {
                instructionType,
                ...parseUpdateConfigInstruction(instruction),
            };
    }
}
