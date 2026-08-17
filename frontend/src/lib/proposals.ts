import type { GlobalConfig } from '@solana/svmgov';

import type { GlobalConfigAccount } from '@/contexts/GlobalConfigContext';

export type ProposalStatus = 'supporting' | 'discussion' | 'voting' | 'finalized' | 'failed';
export type ProposalFailureAt = 'support' | 'voting';

export function showsVoteResults(status: ProposalStatus, failedAt?: ProposalFailureAt): boolean {
    return status === 'voting' || status === 'finalized' || failedAt === 'voting';
}

export interface EpochConstants {
    SUPPORT_EPOCHS: bigint;
    DISCUSSION_EPOCHS: bigint;
    SNAPSHOT_EPOCHS: bigint;
    VOTING_EPOCHS: bigint;
}

export function epochConstantsFromGlobalConfig(config: GlobalConfigAccount): EpochConstants {
    return {
        DISCUSSION_EPOCHS: config.discussionEpochs,
        SNAPSHOT_EPOCHS: config.snapshotEpochExtension,
        SUPPORT_EPOCHS: config.maxSupportEpochs,
        VOTING_EPOCHS: config.votingEpochs,
    };
}

/** Fallback support threshold while the on-chain config is loading. */
export const DEFAULT_SUPPORT_THRESHOLD_PERCENT = 15;

export function supportThresholdPercentFromConfig(
    clusterSupportPctMinBps: Partial<GlobalConfig>['clusterSupportPctMinBps'],
): number {
    return clusterSupportPctMinBps === undefined
        ? DEFAULT_SUPPORT_THRESHOLD_PERCENT
        : Number(clusterSupportPctMinBps) / 100;
}

export interface GetProposalStatusParams {
    clusterSupportLamports: number;
    clusterSupportPctMinBps: number;
    consensusResult: string | null;
    creationEpoch: bigint;
    currentEpoch: bigint;
    endEpoch: bigint;
    epochConstants: EpochConstants;
    finalized: boolean;
    startEpoch: bigint;
    totalStakedLamports: number;
    voting: boolean;
}

export interface ProposalPhaseEpochs {
    discussionEndEpoch: bigint;
    discussionStartEpoch: bigint;
    phaseBaseEpoch: bigint;
    snapshotEpoch: bigint;
    supportEndEpoch: bigint;
    supportStartEpoch: bigint;
}

export interface ProposalPhaseAnchors {
    startEpoch: bigint;
    voting: boolean;
}

export function getProposalPhaseEpochs(
    creationEpoch: bigint,
    epochs: EpochConstants,
    onChain?: ProposalPhaseAnchors,
): ProposalPhaseEpochs {
    const supportStartEpoch = creationEpoch;
    const supportEndEpoch = creationEpoch + epochs.SUPPORT_EPOCHS + 1n;
    const phaseBaseEpoch = supportEndEpoch;
    const discussionStartEpoch = phaseBaseEpoch;
    let discussionEndEpoch = phaseBaseEpoch + epochs.DISCUSSION_EPOCHS;
    let snapshotEpoch = phaseBaseEpoch + epochs.DISCUSSION_EPOCHS + epochs.SNAPSHOT_EPOCHS;

    if (onChain?.voting && onChain.startEpoch > 0n) {
        discussionEndEpoch = onChain.startEpoch;
        snapshotEpoch = onChain.startEpoch;
    }

    return {
        discussionEndEpoch,
        discussionStartEpoch,
        phaseBaseEpoch,
        snapshotEpoch,
        supportEndEpoch,
        supportStartEpoch,
    };
}

export const getProposalStatus = ({
    clusterSupportLamports,
    clusterSupportPctMinBps,
    consensusResult,
    creationEpoch,
    currentEpoch,
    endEpoch,
    epochConstants: epochs,
    finalized,
    startEpoch,
    totalStakedLamports,
    voting,
}: GetProposalStatusParams): ProposalStatus => {
    if (finalized) {
        return 'finalized';
    }

    if (currentEpoch >= endEpoch && endEpoch !== 0n) {
        if (!voting) {
            return 'failed';
        }
        return 'finalized';
    }

    const { discussionEndEpoch, discussionStartEpoch, snapshotEpoch, supportEndEpoch, supportStartEpoch } =
        getProposalPhaseEpochs(creationEpoch, epochs);
    const votingStartEpoch = voting ? startEpoch : snapshotEpoch + 1n;

    if (currentEpoch < supportStartEpoch) {
        return 'supporting';
    }

    if (voting) {
        if (currentEpoch < votingStartEpoch) {
            return 'discussion';
        }
        if (consensusResult) {
            return 'voting';
        }
        return 'discussion';
    }

    if (currentEpoch === supportStartEpoch) {
        return 'supporting';
    }

    if (currentEpoch < supportEndEpoch) {
        return 'supporting';
    }

    if (currentEpoch === supportEndEpoch) {
        const requiredThresholdLamports = totalStakedLamports * (clusterSupportPctMinBps / 10_000);
        if (clusterSupportLamports < requiredThresholdLamports) {
            return 'failed';
        }
        return 'discussion';
    }

    if (currentEpoch >= discussionStartEpoch && currentEpoch <= discussionEndEpoch) {
        return 'failed';
    }

    if (currentEpoch > discussionEndEpoch) {
        return 'failed';
    }

    return 'supporting';
};

export type NextStage = {
    epoch: bigint;
    status: ProposalStatus;
};

export function getNextStage({
    creationEpoch,
    endEpoch,
    epochConstants,
    startEpoch,
    status,
    voting,
}: {
    creationEpoch: bigint;
    endEpoch: bigint;
    epochConstants: EpochConstants;
    startEpoch: bigint;
    status: ProposalStatus;
    voting: boolean;
}): NextStage | null {
    if (status === 'finalized' || status === 'failed') {
        return null;
    }

    const phases = getProposalPhaseEpochs(creationEpoch, epochConstants, { startEpoch, voting });

    if (status === 'supporting') {
        return { epoch: phases.supportEndEpoch, status: 'discussion' };
    }

    if (status === 'discussion') {
        const votingStartEpoch = voting && startEpoch > 0n ? startEpoch : phases.snapshotEpoch + 1n;
        return { epoch: votingStartEpoch, status: 'voting' };
    }

    if (status === 'voting' && endEpoch > 0n) {
        return { epoch: endEpoch, status: 'finalized' };
    }

    return null;
}

export type VoteProgress = {
    quorumLamports: number;
    ratio: number;
    votedLamports: number;
};

const PROGRESS_RING_STATUSES = new Set<ProposalStatus>(['supporting', 'voting']);

export function hasVoteProgress(status: ProposalStatus): boolean {
    return PROGRESS_RING_STATUSES.has(status);
}

export function getSupportProgress(
    clusterSupportLamports: number,
    totalStakedLamports: number,
    clusterSupportPctMinBps: number,
): VoteProgress {
    const requiredLamports = totalStakedLamports * (clusterSupportPctMinBps / 10_000);

    return {
        quorumLamports: requiredLamports,
        ratio: requiredLamports > 0 ? Math.min(1, clusterSupportLamports / requiredLamports) : 0,
        votedLamports: clusterSupportLamports,
    };
}

export function getVoteQuorumProgress(
    forVotesLamports: number,
    againstVotesLamports: number,
    abstainVotesLamports: number,
    totalStakedLamports: number,
    quorumPercent: number,
): VoteProgress {
    const votedLamports = forVotesLamports + againstVotesLamports + abstainVotesLamports;
    const quorumLamports = totalStakedLamports * (quorumPercent / 100);

    return {
        quorumLamports,
        ratio: quorumLamports > 0 ? Math.min(1, votedLamports / quorumLamports) : 0,
        votedLamports,
    };
}
