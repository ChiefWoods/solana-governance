'use client';

import type { Address } from '@solana/kit';
import { useMemo } from 'react';

import { useGlobalConfig, type GlobalConfigAccount } from '@/contexts/GlobalConfigContext';
import { useProposals, type ProposalAccount } from '@/contexts/ProposalsContext';
import { useClusterStake } from '@/hooks/useClusterStake';
import { useEpochInfo } from '@/hooks/useEpochInfo';
import { useSnapshotMeta } from '@/hooks/useSnapshotMeta';
import { getProposalRefFromUrl, type ProposalRef } from '@/lib/github';
import {
    epochConstantsFromGlobalConfig,
    getNextStage,
    getProposalStatus,
    getSnapshotQuorumTotal,
    getSupportProgress,
    getVoteQuorumProgress,
    type EpochConstants,
    type NextStage,
    type ProposalStatus,
    type VoteProgress,
} from '@/lib/proposals';

export type ProposalRow = {
    address: Address;
    consensusResult: Address | null;
    creationTimestamp: number;
    description: string;
    endEpoch: bigint;
    finalized: boolean;
    nextStage: NextStage | null;
    proposalRef: ProposalRef | undefined;
    quorumPercent: number;
    quorumTotalLamports: bigint | undefined;
    startEpoch: bigint;
    status: ProposalStatus;
    title: string;
    voteProgress: VoteProgress | null;
    voting: boolean;
};

const EMPTY_ROWS: ProposalRow[] = [];

function rowProgress(
    proposal: ProposalAccount,
    status: ProposalStatus,
    totalStakedLamports: number,
    clusterSupportPctMinBps: number,
    quorumPercent: number,
    quorumTotalLamports: bigint | undefined,
): VoteProgress | null {
    if (status === 'supporting') {
        return getSupportProgress(
            Number(proposal.clusterSupportLamports),
            totalStakedLamports,
            clusterSupportPctMinBps,
        );
    }

    if (status === 'voting') {
        if (quorumTotalLamports === undefined) return null;
        return getVoteQuorumProgress(
            Number(proposal.forVotesLamports),
            Number(proposal.againstVotesLamports),
            Number(proposal.abstainVotesLamports),
            Number(quorumTotalLamports),
            quorumPercent,
        );
    }

    return null;
}

function mapProposalRow(
    proposal: ProposalAccount,
    currentEpoch: bigint,
    totalStakedLamports: number,
    epochConstants: EpochConstants,
    clusterSupportPctMinBps: number,
    snapshotMeta: ReturnType<typeof useSnapshotMeta>['data'],
): ProposalRow {
    const quorumPercent = 100 / 3;
    const quorumTotalLamports = getSnapshotQuorumTotal(snapshotMeta, proposal.snapshotSlot);
    const status = getProposalStatus({
        clusterSupportLamports: Number(proposal.clusterSupportLamports),
        clusterSupportPctMinBps,
        consensusResult: proposal.consensusResult,
        creationEpoch: proposal.creationEpoch,
        currentEpoch,
        endEpoch: proposal.endEpoch,
        epochConstants,
        finalized: proposal.finalized,
        startEpoch: proposal.startEpoch,
        totalStakedLamports,
        voting: proposal.voting,
    });

    return {
        address: proposal.address,
        consensusResult: proposal.consensusResult,
        creationTimestamp: Number(proposal.creationTimestamp),
        description: proposal.description,
        endEpoch: proposal.endEpoch,
        finalized: proposal.finalized,
        nextStage: getNextStage({
            creationEpoch: proposal.creationEpoch,
            endEpoch: proposal.endEpoch,
            epochConstants,
            startEpoch: proposal.startEpoch,
            status,
            voting: proposal.voting,
        }),
        proposalRef: getProposalRefFromUrl(proposal.description),
        quorumPercent,
        quorumTotalLamports,
        startEpoch: proposal.startEpoch,
        status,
        title: proposal.title,
        voteProgress: rowProgress(
            proposal,
            status,
            totalStakedLamports,
            clusterSupportPctMinBps,
            quorumPercent,
            quorumTotalLamports,
        ),
        voting: proposal.voting,
    };
}

function mapProposalRows(
    proposals: ProposalAccount[],
    currentEpoch: bigint,
    totalStakedLamports: number,
    config: GlobalConfigAccount,
    snapshotMeta: ReturnType<typeof useSnapshotMeta>['data'],
): ProposalRow[] {
    const epochConstants = epochConstantsFromGlobalConfig(config);
    const clusterSupportPctMinBps = Number(config.clusterSupportPctMinBps);

    return proposals
        .map(proposal =>
            mapProposalRow(
                proposal,
                currentEpoch,
                totalStakedLamports,
                epochConstants,
                clusterSupportPctMinBps,
                snapshotMeta,
            ),
        )
        .toSorted((a, b) => b.creationTimestamp - a.creationTimestamp);
}

export function useProposalRows() {
    const proposalsQuery = useProposals();
    const globalConfigQuery = useGlobalConfig();
    const epochQuery = useEpochInfo();
    const clusterStakeQuery = useClusterStake();
    const snapshotMetaQuery = useSnapshotMeta();

    const rows = useMemo(() => {
        if (
            !proposalsQuery.data ||
            !globalConfigQuery.data ||
            epochQuery.data === undefined ||
            clusterStakeQuery.data === undefined
        ) {
            return EMPTY_ROWS;
        }

        return mapProposalRows(
            proposalsQuery.data,
            epochQuery.data.epoch,
            clusterStakeQuery.data,
            globalConfigQuery.data,
            snapshotMetaQuery.data,
        );
    }, [clusterStakeQuery.data, epochQuery.data, globalConfigQuery.data, proposalsQuery.data, snapshotMetaQuery.data]);

    const error =
        proposalsQuery.error ?? globalConfigQuery.error ?? epochQuery.error ?? clusterStakeQuery.error ?? null;

    // Disabled or persist-paused queries report isLoading=false even before data exists.
    // Keep the table in a loading state until every input needed to map rows is present.
    const isLoading =
        error === null &&
        (proposalsQuery.data === undefined ||
            globalConfigQuery.data === undefined ||
            epochQuery.data === undefined ||
            clusterStakeQuery.data === undefined);

    return {
        currentEpoch: epochQuery.data?.epoch,
        error,
        isEpochLoading: epochQuery.isLoading,
        isLoading,
        refetch: proposalsQuery.refetch,
        rows,
    };
}
