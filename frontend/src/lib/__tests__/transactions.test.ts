import { address, type TransactionModifyingSigner } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import type { GlobalConfigAccount } from '@/contexts/GlobalConfigContext';

const mockFindMetaMerkleProofPda = vi.fn();
const mockFindBallotBoxPda = vi.fn();
const mockGetCastVoteInstructionAsync = vi.fn();
const mockGetCastVoteOverrideInstructionAsync = vi.fn();
const mockGetFinalizeProposalInstruction = vi.fn();
const mockGetModifyVoteInstructionAsync = vi.fn();
const mockGetModifyVoteOverrideInstructionAsync = vi.fn();
const mockGetSupportProposalInstructionAsync = vi.fn();

vi.mock('@solana/ncn-snapshot', () => ({
    findBallotBoxPda: (...args: unknown[]) => mockFindBallotBoxPda(...args),
    findMetaMerkleProofPda: (...args: unknown[]) => mockFindMetaMerkleProofPda(...args),
    NCN_SNAPSHOT_PROGRAM_ADDRESS: address('11111111111111111111111111111111'),
}));

vi.mock('@solana/svmgov', () => ({
    getCastVoteInstructionAsync: (...args: unknown[]) => mockGetCastVoteInstructionAsync(...args),
    getCastVoteOverrideInstructionAsync: (...args: unknown[]) => mockGetCastVoteOverrideInstructionAsync(...args),
    getModifyVoteInstructionAsync: (...args: unknown[]) => mockGetModifyVoteInstructionAsync(...args),
    getModifyVoteOverrideInstructionAsync: (...args: unknown[]) => mockGetModifyVoteOverrideInstructionAsync(...args),
    getCreateProposalInstructionAsync: vi.fn(),
    getFinalizeProposalInstruction: (...args: unknown[]) => mockGetFinalizeProposalInstruction(...args),
    getSupportProposalInstructionAsync: (...args: unknown[]) => mockGetSupportProposalInstructionAsync(...args),
}));

import {
    buildCastVoteInstruction,
    buildCastVoteOverrideInstruction,
    buildFinalizeProposalInstruction,
    buildModifyVoteInstruction,
    buildModifyVoteOverrideInstruction,
    buildSupportProposalInstruction,
    firstSlotOfEpoch,
    snapshotSlotForSupport,
} from '../transactions';

describe('buildFinalizeProposalInstruction', () => {
    it('builds the on-chain finalization instruction for the supplied proposal', async () => {
        const proposal = address('11111111111111111111111111111111');
        const signer = {} as TransactionModifyingSigner;
        mockGetFinalizeProposalInstruction.mockReturnValue({});

        await buildFinalizeProposalInstruction({ proposal, signer });

        expect(mockGetFinalizeProposalInstruction).toHaveBeenCalledWith({ proposal, signer });
    });
});

describe('firstSlotOfEpoch', () => {
    it('uses the RPC epoch schedule after the warmup epochs', () => {
        expect(
            firstSlotOfEpoch(
                {
                    firstNormalEpoch: 14n,
                    firstNormalSlot: 524_256n,
                    leaderScheduleSlotOffset: 432_000n,
                    slotsPerEpoch: 432_000n,
                    warmup: false,
                },
                20n,
            ),
        ).toBe(3_116_256n);
    });
});

describe('snapshotSlotForSupport', () => {
    it('derives the snapshot slot from supplied epoch RPC results', () => {
        const globalConfig: GlobalConfigAccount = {
            address: address('11111111111111111111111111111111'),
            admin: address('11111111111111111111111111111111'),
            bump: 0,
            clusterSupportPctMinBps: 1_000n,
            discussionEpochs: 2n,
            maxDescriptionLength: 1_024,
            maxSupportEpochs: 2n,
            maxSupporters: 100,
            maxTitleLength: 128,
            minProposalStakeLamports: 1n,
            pendingAdmin: null,
            snapshotEpochExtension: 1n,
            snapshotSlotOffset: 100n,
            votingEpochs: 4n,
        };

        expect(
            snapshotSlotForSupport(
                { epoch: 20n },
                {
                    firstNormalEpoch: 14n,
                    firstNormalSlot: 524_256n,
                    leaderScheduleSlotOffset: 432_000n,
                    slotsPerEpoch: 432_000n,
                    warmup: false,
                },
                globalConfig,
            ),
        ).toBe(4_412_356n);
    });
});

describe('buildCastVoteInstruction', () => {
    it('derives the proof PDA from the supplied vote account', async () => {
        const consensusResult = address('11111111111111111111111111111111');
        const voteAccount = address('11111111111111111111111111111111');
        const metaMerkleProof = address('11111111111111111111111111111111');
        mockFindMetaMerkleProofPda.mockResolvedValue([metaMerkleProof]);
        mockGetCastVoteInstructionAsync.mockResolvedValue({});

        await buildCastVoteInstruction({
            consensusResult,
            distribution: { abstain: 0, against: 0, for: 100 },
            proposal: address('11111111111111111111111111111111'),
            signer: {} as TransactionModifyingSigner,
            splVoteAccount: address('11111111111111111111111111111111'),
            voteAccount,
        });

        expect(mockFindMetaMerkleProofPda).toHaveBeenCalledWith({ consensusResult, voteAccount });
    });
});

describe('buildCastVoteOverrideInstruction', () => {
    it('derives the proof PDA from the supplied vote account', async () => {
        const consensusResult = address('11111111111111111111111111111111');
        const voteAccount = address('11111111111111111111111111111111');
        const metaMerkleProof = address('11111111111111111111111111111111');
        mockFindMetaMerkleProofPda.mockResolvedValue([metaMerkleProof]);
        mockGetCastVoteOverrideInstructionAsync.mockResolvedValue({});

        await buildCastVoteOverrideInstruction({
            consensusResult,
            distribution: { abstain: 0, against: 0, for: 100 },
            proposal: address('11111111111111111111111111111111'),
            signer: {} as TransactionModifyingSigner,
            stakeAccount: address('11111111111111111111111111111111'),
            stakeMerkleLeaf: {
                activeStake: 1n,
                stakeAccount: address('11111111111111111111111111111111'),
                votingWallet: address('11111111111111111111111111111111'),
            },
            stakeMerkleProof: [],
            voteAccount,
        });

        expect(mockFindMetaMerkleProofPda).toHaveBeenCalledWith({ consensusResult, voteAccount });
    });
});

describe('modify vote instruction builders', () => {
    it('uses the modify instruction for an existing validator vote', async () => {
        const consensusResult = address('11111111111111111111111111111111');
        const voteAccount = address('11111111111111111111111111111111');
        const metaMerkleProof = address('11111111111111111111111111111111');
        mockFindMetaMerkleProofPda.mockResolvedValue([metaMerkleProof]);
        mockGetModifyVoteInstructionAsync.mockResolvedValue({});

        await buildModifyVoteInstruction({
            consensusResult,
            distribution: { abstain: 0, against: 0, for: 100 },
            proposal: address('11111111111111111111111111111111'),
            signer: {} as TransactionModifyingSigner,
            splVoteAccount: address('11111111111111111111111111111111'),
            voteAccount,
        });

        expect(mockGetModifyVoteInstructionAsync).toHaveBeenCalledOnce();
    });

    it('uses the modify instruction for an existing stake override', async () => {
        const consensusResult = address('11111111111111111111111111111111');
        const voteAccount = address('11111111111111111111111111111111');
        const metaMerkleProof = address('11111111111111111111111111111111');
        mockFindMetaMerkleProofPda.mockResolvedValue([metaMerkleProof]);
        mockGetModifyVoteOverrideInstructionAsync.mockResolvedValue({});

        await buildModifyVoteOverrideInstruction({
            consensusResult,
            distribution: { abstain: 0, against: 0, for: 100 },
            proposal: address('11111111111111111111111111111111'),
            signer: {} as TransactionModifyingSigner,
            stakeAccount: address('11111111111111111111111111111111'),
            stakeMerkleLeaf: {
                activeStake: 1n,
                stakeAccount: address('11111111111111111111111111111111'),
                votingWallet: address('11111111111111111111111111111111'),
            },
            stakeMerkleProof: [],
            voteAccount,
        });

        expect(mockGetModifyVoteOverrideInstructionAsync).toHaveBeenCalledOnce();
    });
});

describe('buildSupportProposalInstruction', () => {
    it('derives the ballot box from the supplied snapshot slot', async () => {
        const snapshotSlot = 4_412_356n;
        const ballotBox = address('11111111111111111111111111111111');
        mockFindBallotBoxPda.mockResolvedValue([ballotBox]);
        mockGetSupportProposalInstructionAsync.mockResolvedValue({});

        await buildSupportProposalInstruction({
            proposal: address('11111111111111111111111111111111'),
            signer: {} as TransactionModifyingSigner,
            snapshotSlot,
            splVoteAccount: address('11111111111111111111111111111111'),
        });

        expect(mockFindBallotBoxPda).toHaveBeenCalledWith({ snapshotSlot });
    });
});
