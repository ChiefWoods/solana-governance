'use client';

import type { Address } from '@solana/kit';
import { useMemo } from 'react';

import { useGlobalConfig, type GlobalConfigAccount } from '@/contexts/GlobalConfigContext';
import { useProposals, type ProposalAccount } from '@/contexts/ProposalsContext';
import { useClusterStake } from '@/hooks/useClusterStake';
import { useEpochInfo } from '@/hooks/useEpochInfo';
import { getProposalRefFromUrl, type ProposalRef } from '@/lib/github';
import {
    epochConstantsFromGlobalConfig,
    getNextStage,
    getProposalStatus,
    getVoteQuorumProgress,
    hasVoteProgress,
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
    startEpoch: bigint;
    status: ProposalStatus;
    title: string;
    voteProgress: VoteProgress | null;
    voting: boolean;
};

const EMPTY_ROWS: ProposalRow[] = [];

function mapProposalRow(
    proposal: ProposalAccount,
    currentEpoch: bigint,
    totalStakedLamports: number,
    epochConstants: EpochConstants,
    clusterSupportPctMinBps: number,
): ProposalRow {
    const quorumPercent = 60;
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
        startEpoch: proposal.startEpoch,
        status,
        title: proposal.title,
        voteProgress: hasVoteProgress(status)
            ? getVoteQuorumProgress(
                  Number(proposal.forVotesLamports),
                  Number(proposal.againstVotesLamports),
                  Number(proposal.abstainVotesLamports),
                  totalStakedLamports,
                  quorumPercent,
              )
            : null,
        voting: proposal.voting,
    };
}

function mapProposalRows(
    proposals: ProposalAccount[],
    currentEpoch: bigint,
    totalStakedLamports: number,
    config: GlobalConfigAccount,
): ProposalRow[] {
    const epochConstants = epochConstantsFromGlobalConfig(config);
    const clusterSupportPctMinBps = Number(config.clusterSupportPctMinBps);

    return proposals
        .map(proposal =>
            mapProposalRow(proposal, currentEpoch, totalStakedLamports, epochConstants, clusterSupportPctMinBps),
        )
        .toSorted((a, b) => b.creationTimestamp - a.creationTimestamp);
}

export function useProposalRows() {
    const proposalsQuery = useProposals();
    const globalConfigQuery = useGlobalConfig();
    const epochQuery = useEpochInfo();
    const clusterStakeQuery = useClusterStake();

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
        );
    }, [clusterStakeQuery.data, epochQuery.data, globalConfigQuery.data, proposalsQuery.data]);

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
