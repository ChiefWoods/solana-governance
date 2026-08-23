import { describe, expect, it } from 'vitest';

import {
    canFinalizeProposal,
    getVotingStageAction,
    getNextStage,
    getProposalPhaseEpochs,
    getProposalStatus,
    getSnapshotQuorumTotal,
    getSupportProgress,
    getVoteQuorumProgress,
    hasVoteProgress,
    showsVoteResults,
} from '../proposals';
import type { EpochConstants, GetProposalStatusParams } from '../proposals';

describe('canFinalizeProposal', () => {
    it('only enables finalization after voting ends for an unfinalized proposal', () => {
        expect(canFinalizeProposal({ currentEpoch: 100n, endEpoch: 101n, finalized: false })).toBe(false);
        expect(canFinalizeProposal({ currentEpoch: 101n, endEpoch: 101n, finalized: false })).toBe(true);
        expect(canFinalizeProposal({ currentEpoch: 102n, endEpoch: 101n, finalized: true })).toBe(false);
    });
});

describe('getVotingStageAction', () => {
    it('keeps voting available until an unfinalized proposal reaches its end epoch', () => {
        expect(getVotingStageAction({ currentEpoch: 100n, endEpoch: 101n, finalized: false })).toBe('vote');
        expect(getVotingStageAction({ currentEpoch: 101n, endEpoch: 101n, finalized: false })).toBe('finalize');
    });
});

describe('getProposalStatus', () => {
    const creationEpoch = 800n;
    const totalStakedLamports = 100_000_000_000; // 100M SOL in lamports
    // 10% threshold (1000 bps), passed through params like the on-chain config
    const clusterSupportPctMinBps = 1000;
    const requiredThresholdLamports = totalStakedLamports * 0.1; // 10% = 10M SOL
    const mockConsensusResult = '11111111111111111111111111111111';

    // Epoch lengths aligned with former testnet defaults used by these tests
    const epochs: EpochConstants = {
        SUPPORT_EPOCHS: 1n,
        DISCUSSION_EPOCHS: 2n,
        SNAPSHOT_EPOCHS: 1n,
        VOTING_EPOCHS: 4n,
    };

    // When support is reached at supportEndEpoch, backend sets startEpoch as:
    // startEpoch = supportEndEpoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCHS
    const supportEndEpoch = creationEpoch + epochs.SUPPORT_EPOCHS + 1n; // epoch 802
    const startEpochWhenSupportReached = supportEndEpoch + epochs.DISCUSSION_EPOCHS + epochs.SNAPSHOT_EPOCHS; // epoch 805
    const endEpochWhenSupportReached = startEpochWhenSupportReached + epochs.VOTING_EPOCHS; // epoch 809

    // Default startEpoch: when voting is false, this doesn't matter
    // When voting is true, this should be the calculated startEpoch when support was reached
    const defaultStartEpoch = startEpochWhenSupportReached; // epoch 805
    const defaultEndEpoch = endEpochWhenSupportReached; // epoch 809

    const baseParams: Omit<GetProposalStatusParams, 'currentEpoch' | 'clusterSupportLamports'> = {
        creationEpoch,
        startEpoch: defaultStartEpoch,
        endEpoch: defaultEndEpoch,
        totalStakedLamports,
        clusterSupportPctMinBps,
        consensusResult: undefined,
        finalized: false,
        voting: false,
        epochConstants: epochs,
    };

    const testSuites = [
        {
            describe: 'finalized proposals',
            testCases: [
                {
                    description: "should return 'finalized' when finalized is true, regardless of other params",
                    params: {
                        currentEpoch: 900n,
                        clusterSupportLamports: 0,
                        finalized: true,
                        voting: false,
                    },
                    expected: 'finalized' as const,
                },
                {
                    description: "should return 'finalized' even if voting flag is true",
                    params: {
                        currentEpoch: 900n,
                        clusterSupportLamports: 0,
                        finalized: true,
                        voting: true,
                    },
                    expected: 'finalized' as const,
                },
            ],
        },
        {
            describe: 'during support phase',
            testCases: [
                {
                    description:
                        "should return 'supporting' when currentEpoch equals support start epoch (creationEpoch)",
                    params: {
                        currentEpoch: creationEpoch, // epoch 800, support phase starts
                        clusterSupportLamports: 0,
                    },
                    expected: 'supporting' as const,
                },
                {
                    description: "should return 'supporting' during support phase (epoch 801)",
                    params: {
                        currentEpoch: creationEpoch + 1n, // epoch 801, still in support phase
                        clusterSupportLamports: 0,
                    },
                    expected: 'supporting' as const,
                },
            ],
        },
        {
            describe: 'at support end epoch (threshold check)',
            testCases: [
                {
                    description: "should return 'failed' when threshold is not met at support end epoch",
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802
                        clusterSupportLamports: requiredThresholdLamports - 1, // Just below threshold
                    },
                    expected: 'failed' as const,
                },
                {
                    description: "should return 'discussion' when threshold is met at support end epoch",
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802
                        clusterSupportLamports: requiredThresholdLamports, // Exactly at threshold
                    },
                    expected: 'discussion' as const,
                },
                {
                    description: "should return 'discussion' when threshold is exceeded at support end epoch",
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802
                        clusterSupportLamports: requiredThresholdLamports + 1_000_000, // Above threshold
                    },
                    expected: 'discussion' as const,
                },
            ],
        },
        {
            describe: 'during discussion phase',
            testCases: [
                {
                    description:
                        "should return 'discussion' at discussion start epoch (epoch 802) when threshold was met",
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802 - threshold check returns discussion if met
                        clusterSupportLamports: requiredThresholdLamports, // Threshold met
                    },
                    expected: 'discussion' as const,
                },
                {
                    description: "should return 'discussion' during middle of discussion phase (epoch 803)",
                    params: {
                        currentEpoch: creationEpoch + 3n, // epoch 803
                        clusterSupportLamports: requiredThresholdLamports, // Threshold was met
                        voting: true, // Threshold was met, so voting flag should be true
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
                {
                    description: "should return 'discussion' at discussion end epoch (epoch 804)",
                    params: {
                        currentEpoch: creationEpoch + 4n, // epoch 804
                        clusterSupportLamports: requiredThresholdLamports, // Threshold was met
                        voting: true, // Threshold was met, so voting flag should be true
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
                {
                    description:
                        "should return 'failed' during discussion phase (epoch 803) if threshold was not met (voting flag is false)",
                    params: {
                        currentEpoch: creationEpoch + 3n, // epoch 803 - in discussion phase range
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
                {
                    description:
                        "should return 'failed' during discussion phase (epoch 804) if threshold was not met (voting flag is false)",
                    params: {
                        currentEpoch: creationEpoch + 4n, // epoch 804 - in discussion phase range
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
            ],
        },
        {
            describe: 'snapshot phase',
            testCases: [
                {
                    description: "should return 'discussion' at snapshot epoch (epoch 805) when threshold was met",
                    params: {
                        currentEpoch: creationEpoch + 5n, // epoch 805
                        clusterSupportLamports: requiredThresholdLamports,
                        voting: true, // Threshold was met
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
            ],
        },
        {
            describe: 'past discussion phase - using voting flag',
            testCases: [
                {
                    description:
                        "should return 'failed' when voting flag is false after discussion phase (support threshold was not met)",
                    params: {
                        currentEpoch: creationEpoch + 6n, // epoch 806
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
                {
                    description:
                        "should return 'failed' when voting flag is false at epoch 807 (support threshold was not met)",
                    params: {
                        currentEpoch: creationEpoch + 7n,
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
                {
                    description:
                        "should return 'failed' when voting flag is false at snapshot epoch (epoch 805) if threshold was not met",
                    params: {
                        currentEpoch: creationEpoch + 5n, // epoch 805
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
                {
                    description:
                        "should return 'failed' when voting flag is false even if currentEpoch >= endEpoch (failed proposals should show as failed, not finalized)",
                    params: {
                        currentEpoch: defaultEndEpoch, // epoch 809 - equals endEpoch
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
                {
                    description:
                        "should return 'failed' when voting flag is false even if currentEpoch > endEpoch (failed proposals should show as failed, not finalized)",
                    params: {
                        currentEpoch: defaultEndEpoch + 10n, // epoch 819 - past endEpoch
                        clusterSupportLamports: requiredThresholdLamports - 1, // Threshold not met
                        voting: false, // On-chain flag indicates threshold was not met
                    },
                    expected: 'failed' as const,
                },
            ],
        },
        {
            describe: 'voting phase - with consensusResult',
            testCases: [
                {
                    description:
                        "should return 'voting' when voting flag is true, consensusResult exists, and at voting start epoch",
                    params: {
                        currentEpoch: startEpochWhenSupportReached, // epoch 805 - voting start epoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'voting' as const,
                },
                {
                    description:
                        "should return 'voting' when voting flag is true, consensusResult exists, and past voting start epoch but before end epoch",
                    params: {
                        currentEpoch: endEpochWhenSupportReached - 1n, // epoch 808 - before end epoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'voting' as const,
                },
                {
                    description:
                        "should return 'voting' when currentEpoch equals endEpoch until the proposal is finalized on-chain",
                    params: {
                        currentEpoch: endEpochWhenSupportReached, // epoch 809 - equals endEpoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                        finalized: false,
                    },
                    expected: 'voting' as const,
                },
                {
                    description:
                        "should return 'voting' when currentEpoch exceeds endEpoch until the proposal is finalized on-chain",
                    params: {
                        currentEpoch: endEpochWhenSupportReached + 1n, // epoch 810 - past endEpoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                        finalized: false,
                    },
                    expected: 'voting' as const,
                },
            ],
        },
        {
            describe: 'voting phase - without consensusResult (snapshot not ready)',
            testCases: [
                {
                    description:
                        "should return 'discussion' when voting flag is true but consensusResult is undefined at voting start epoch",
                    params: {
                        currentEpoch: startEpochWhenSupportReached, // epoch 805 - voting start epoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: undefined,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
                {
                    description:
                        "should return 'discussion' when voting flag is true but consensusResult is undefined past voting start epoch but before end epoch",
                    params: {
                        currentEpoch: endEpochWhenSupportReached - 1n, // epoch 808 - before end epoch
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: undefined,
                        voting: true,
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
            ],
        },
        {
            describe: 'edge cases',
            testCases: [
                {
                    description: 'should handle zero total staked lamports',
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802
                        totalStakedLamports: 0,
                        clusterSupportLamports: 0,
                    },
                    expected: 'discussion' as const,
                    note: 'With zero total stake, threshold is 0, so any support should pass',
                },
                {
                    description: "should return 'voting' for very large epoch numbers until finalized on-chain",
                    params: {
                        currentEpoch: creationEpoch + 1000n,
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true, // Threshold was met
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                        finalized: false,
                    },
                    expected: 'voting' as const,
                },
                {
                    description: "should return 'supporting' as fallback for epoch 801 (during support phase)",
                    params: {
                        currentEpoch: creationEpoch + 1n, // epoch 801
                        clusterSupportLamports: requiredThresholdLamports,
                        voting: false,
                    },
                    expected: 'supporting' as const,
                    note: 'Epoch 801 is during support phase, falls through to fallback',
                },
            ],
        },
        {
            describe: 'threshold calculation',
            testCases: [
                {
                    description: 'should correctly calculate threshold as 10% of total staked - just below threshold',
                    params: {
                        currentEpoch: creationEpoch + 2n,
                        totalStakedLamports: 1_000_000_000, // 1M SOL
                        clusterSupportLamports: 100_000_000 - 1, // Just below 10% = 100k SOL
                    },
                    expected: 'failed' as const,
                },
                {
                    description: 'should correctly calculate threshold as 10% of total staked - exactly at threshold',
                    params: {
                        currentEpoch: creationEpoch + 2n,
                        totalStakedLamports: 1_000_000_000, // 1M SOL
                        clusterSupportLamports: 100_000_000, // Exactly 10% = 100k SOL
                    },
                    expected: 'discussion' as const,
                },
            ],
        },
    ];

    // Iterate over test suites to create describe blocks and tests
    testSuites.forEach(({ describe: describeTitle, testCases }) => {
        describe(describeTitle, () => {
            testCases.forEach(({ description, params, expected }) => {
                it(description, () => {
                    const result = getProposalStatus({
                        ...baseParams,
                        ...params,
                    });
                    expect(result).toBe(expected);
                });
            });
        });
    });

    // Test that verifies startEpoch calculation when support is reached
    describe('startEpoch calculation when support is reached', () => {
        it('should use startEpoch = supportEndEpoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCHS when voting is true', () => {
            // When support is reached at supportEndEpoch (epoch 802), backend sets:
            // startEpoch = supportEndEpoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCHS
            // For testnet: 802 + 2 + 1 = 805
            const expectedStartEpoch = supportEndEpoch + epochs.DISCUSSION_EPOCHS + epochs.SNAPSHOT_EPOCHS;
            expect(expectedStartEpoch).toBe(startEpochWhenSupportReached);
            expect(expectedStartEpoch).toBe(805n); // Verify the calculation

            const expectedEndEpoch = expectedStartEpoch + epochs.VOTING_EPOCHS;

            // Test that before startEpoch, proposal is in discussion phase
            const beforeVotingStart = getProposalStatus({
                ...baseParams,
                currentEpoch: expectedStartEpoch - 1n, // epoch 804
                clusterSupportLamports: requiredThresholdLamports,
                voting: true,
                startEpoch: expectedStartEpoch,
                endEpoch: expectedEndEpoch,
            });
            expect(beforeVotingStart).toBe('discussion');

            // Test that at startEpoch with consensusResult, proposal is in voting phase
            const atVotingStart = getProposalStatus({
                ...baseParams,
                currentEpoch: expectedStartEpoch, // epoch 805
                clusterSupportLamports: requiredThresholdLamports,
                consensusResult: mockConsensusResult,
                voting: true,
                startEpoch: expectedStartEpoch,
                endEpoch: expectedEndEpoch,
            });
            expect(atVotingStart).toBe('voting');
        });
    });

    // Phase transitions tests (these need multiple assertions per test)
    describe('phase transitions', () => {
        it('should transition correctly from supporting to discussion when threshold is met', () => {
            const testCases = [
                {
                    description: 'support phase',
                    params: {
                        currentEpoch: creationEpoch, // epoch 800 - support phase
                        clusterSupportLamports: requiredThresholdLamports,
                    },
                    expected: 'supporting' as const,
                },
                {
                    description: 'threshold check',
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802 - threshold check
                        clusterSupportLamports: requiredThresholdLamports,
                    },
                    expected: 'discussion' as const,
                },
            ];

            testCases.forEach(({ params, expected }) => {
                expect(
                    getProposalStatus({
                        ...baseParams,
                        ...params,
                    }),
                ).toBe(expected);
            });
        });

        it('should transition correctly from supporting to failed when threshold is not met', () => {
            const testCases = [
                {
                    description: 'support phase',
                    params: {
                        currentEpoch: creationEpoch, // epoch 800 - support phase
                        clusterSupportLamports: requiredThresholdLamports - 1,
                    },
                    expected: 'supporting' as const,
                },
                {
                    description: 'threshold check',
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802 - threshold check
                        clusterSupportLamports: requiredThresholdLamports - 1,
                    },
                    expected: 'failed' as const,
                },
            ];

            testCases.forEach(({ params, expected }) => {
                expect(
                    getProposalStatus({
                        ...baseParams,
                        ...params,
                    }),
                ).toBe(expected);
            });
        });

        it('should remain failed after support phase ends if threshold was not met', () => {
            const testCases = [
                {
                    description: 'threshold check',
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802 - threshold check
                        clusterSupportLamports: requiredThresholdLamports - 1,
                    },
                    expected: 'failed' as const,
                },
                {
                    description: 'after support phase',
                    params: {
                        currentEpoch: creationEpoch + 6n, // epoch 806 - past discussion phase
                        clusterSupportLamports: requiredThresholdLamports - 1,
                        voting: false, // Threshold was not met
                    },
                    expected: 'failed' as const,
                },
            ];

            testCases.forEach(({ params, expected }) => {
                expect(
                    getProposalStatus({
                        ...baseParams,
                        ...params,
                    }),
                ).toBe(expected);
            });
        });

        it('should progress to discussion and voting when threshold was met', () => {
            const testCases = [
                {
                    description: 'threshold check',
                    params: {
                        currentEpoch: creationEpoch + 2n, // epoch 802 - threshold check
                        clusterSupportLamports: requiredThresholdLamports,
                    },
                    expected: 'discussion' as const,
                },
                {
                    description: 'discussion phase',
                    params: {
                        currentEpoch: creationEpoch + 3n, // epoch 803 - discussion phase
                        clusterSupportLamports: requiredThresholdLamports,
                        voting: true, // Threshold was met
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'discussion' as const,
                },
                {
                    description: 'voting phase',
                    params: {
                        currentEpoch: startEpochWhenSupportReached, // epoch 805 - voting phase starts
                        clusterSupportLamports: requiredThresholdLamports,
                        consensusResult: mockConsensusResult,
                        voting: true, // Threshold was met
                        startEpoch: startEpochWhenSupportReached, // epoch 805 - when support reached at epoch 802
                        endEpoch: endEpochWhenSupportReached, // epoch 809
                    },
                    expected: 'voting' as const,
                },
            ];

            testCases.forEach(({ params, expected }) => {
                expect(
                    getProposalStatus({
                        ...baseParams,
                        ...params,
                    }),
                ).toBe(expected);
            });
        });
    });
});

describe('getProposalPhaseEpochs', () => {
    // Mainnet-shaped constants (GlobalConfig as of epoch 1012)
    const epochs: EpochConstants = {
        SUPPORT_EPOCHS: 7n,
        DISCUSSION_EPOCHS: 7n,
        SNAPSHOT_EPOCHS: 1n,
        VOTING_EPOCHS: 3n,
    };
    const creationEpoch = 1011n;

    it('projects the worst-case window from creationEpoch while support is in progress', () => {
        const phases = getProposalPhaseEpochs(creationEpoch, epochs);

        expect(phases.supportEndEpoch).toBe(1019n); // 1011 + 7 + 1
        expect(phases.discussionEndEpoch).toBe(1026n); // 1019 + 7
        expect(phases.snapshotEpoch).toBe(1027n); // 1019 + 7 + 1
    });

    it('ignores on-chain anchors while voting is false', () => {
        const phases = getProposalPhaseEpochs(creationEpoch, epochs, {
            voting: false,
            startEpoch: 0n,
        });

        expect(phases.discussionEndEpoch).toBe(1026n);
    });

    it('uses the on-chain startEpoch once support has succeeded', () => {
        // Real mainnet case: threshold met in epoch 1012, program scheduled
        // voting for epoch 1021 — 5 epochs earlier than the worst-case 1026.
        const phases = getProposalPhaseEpochs(creationEpoch, epochs, {
            voting: true,
            startEpoch: 1021n,
        });

        expect(phases.discussionEndEpoch).toBe(1021n);
        expect(phases.snapshotEpoch).toBe(1021n);
        // Support window is historical fact, not affected by the early finish
        expect(phases.supportEndEpoch).toBe(1019n);
    });

    it('falls back to projection when voting is true but startEpoch is unset', () => {
        const phases = getProposalPhaseEpochs(creationEpoch, epochs, {
            voting: true,
            startEpoch: 0n,
        });

        expect(phases.discussionEndEpoch).toBe(1026n);
    });
});

describe('showsVoteResults', () => {
    it('is true for voting, finalized, and failed voting', () => {
        expect(showsVoteResults('voting')).toBe(true);
        expect(showsVoteResults('finalized')).toBe(true);
        expect(showsVoteResults('failed', 'voting')).toBe(true);
    });

    it('is false for support-phase outcomes', () => {
        expect(showsVoteResults('supporting')).toBe(false);
        expect(showsVoteResults('discussion')).toBe(false);
        expect(showsVoteResults('failed')).toBe(false);
        expect(showsVoteResults('failed', 'support')).toBe(false);
    });
});

describe('hasVoteProgress', () => {
    it('is measurable during support and voting', () => {
        expect(hasVoteProgress('supporting')).toBe(true);
        expect(hasVoteProgress('voting')).toBe(true);
        expect(hasVoteProgress('discussion')).toBe(false);
        expect(hasVoteProgress('finalized')).toBe(false);
        expect(hasVoteProgress('failed')).toBe(false);
    });
});

describe('getSupportProgress', () => {
    it('measures cluster support against the required threshold', () => {
        expect(getSupportProgress(7.5, 100, 1500)).toEqual({
            quorumLamports: 15,
            ratio: 0.5,
            votedLamports: 7.5,
        });
    });

    it('caps progress at the required threshold', () => {
        expect(getSupportProgress(20, 100, 1500).ratio).toBe(1);
    });

    it('is zero when stake or the threshold is missing', () => {
        expect(getSupportProgress(10, 0, 1500).ratio).toBe(0);
        expect(getSupportProgress(10, 100, 0).ratio).toBe(0);
    });
});

describe('getVoteQuorumProgress', () => {
    it('measures votes cast against the quorum target', () => {
        expect(getVoteQuorumProgress(20, 5, 5, 100, 60)).toEqual({
            quorumLamports: 60,
            ratio: 0.5,
            votedLamports: 30,
        });
    });

    it('caps progress at quorum', () => {
        expect(getVoteQuorumProgress(80, 10, 10, 100, 60).ratio).toBe(1);
    });

    it('is zero when stake or quorum is missing', () => {
        expect(getVoteQuorumProgress(10, 0, 0, 0, 60).ratio).toBe(0);
        expect(getVoteQuorumProgress(10, 0, 0, 100, 0).ratio).toBe(0);
    });
});

describe('getSnapshotQuorumTotal', () => {
    it('uses the recorded total only for the proposal snapshot', () => {
        expect(
            getSnapshotQuorumTotal({ slot: 422_497_000, total_active_stake: 400_000_000_000_000_000 }, 422_497_000n),
        ).toBe(400_000_000_000_000_000n);
    });

    it('does not substitute a newer snapshot or a missing total', () => {
        expect(getSnapshotQuorumTotal({ slot: 422_497_001, total_active_stake: 1 }, 422_497_000n)).toBeUndefined();
        expect(getSnapshotQuorumTotal({ slot: 422_497_000 }, 422_497_000n)).toBeUndefined();
        expect(getSnapshotQuorumTotal(undefined, 422_497_000n)).toBeUndefined();
    });
});

describe('getNextStage', () => {
    const creationEpoch = 800n;
    const epochs: EpochConstants = {
        DISCUSSION_EPOCHS: 2n,
        SNAPSHOT_EPOCHS: 1n,
        SUPPORT_EPOCHS: 1n,
        VOTING_EPOCHS: 4n,
    };
    const supportEndEpoch = creationEpoch + epochs.SUPPORT_EPOCHS + 1n;
    const startEpoch = supportEndEpoch + epochs.DISCUSSION_EPOCHS + epochs.SNAPSHOT_EPOCHS;
    const endEpoch = startEpoch + epochs.VOTING_EPOCHS;

    it('points supporting at discussion when the support window ends', () => {
        expect(
            getNextStage({
                creationEpoch,
                endEpoch,
                epochConstants: epochs,
                startEpoch,
                status: 'supporting',
                voting: false,
            }),
        ).toEqual({ epoch: supportEndEpoch, status: 'discussion' });
    });

    it('points discussion at the on-chain voting start', () => {
        expect(
            getNextStage({
                creationEpoch,
                endEpoch,
                epochConstants: epochs,
                startEpoch,
                status: 'discussion',
                voting: true,
            }),
        ).toEqual({ epoch: startEpoch, status: 'voting' });
    });

    it('points voting at finalized when voting ends', () => {
        expect(
            getNextStage({
                creationEpoch,
                endEpoch,
                epochConstants: epochs,
                startEpoch,
                status: 'voting',
                voting: true,
            }),
        ).toEqual({ epoch: endEpoch, status: 'finalized' });
    });

    it('has no next stage after the proposal is finished', () => {
        expect(
            getNextStage({
                creationEpoch,
                endEpoch,
                epochConstants: epochs,
                startEpoch,
                status: 'finalized',
                voting: true,
            }),
        ).toBeNull();
        expect(
            getNextStage({
                creationEpoch,
                endEpoch,
                epochConstants: epochs,
                startEpoch,
                status: 'failed',
                voting: false,
            }),
        ).toBeNull();
    });
});
