'use client';

import type { Address } from '@solana/kit';
import { useMemo } from 'react';

import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import { useProposals, type ProposalAccount } from '@/contexts/ProposalsContext';
import { useStakeWiz } from '@/contexts/StakeWizContext';
import { useSupports } from '@/contexts/SupportsContext';
import { useVotes } from '@/contexts/VotesContext';
import { useProposalRows, type ProposalRow } from '@/hooks/useProposalRows';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { percentOf } from '@/lib/format';
import type { ProposalRef } from '@/lib/github';
import { supportThresholdPercentFromConfig, type ProposalStatus } from '@/lib/proposals';
import { mapSupportValidatorRows, mapVoteValidatorRows } from '@/lib/proposalValidators';

export type ProposalDetailModel = {
    abstainPercent: number;
    abstainVotesLamports: bigint;
    address: Address;
    againstPercent: number;
    againstVotesLamports: bigint;
    author: Address;
    clusterSupportLamports: bigint;
    clusterValidatorCount: number;
    createdAtMs: number;
    currentEpoch: bigint | undefined;
    description: string;
    forPercent: number;
    forVotesLamports: bigint;
    nextStageEpoch: bigint | null;
    numSupporters: number;
    participationPercent: number;
    proposalRef: ProposalRef | undefined;
    quorumPercent: number;
    requiredPercent: number;
    requiredSupportLamports: bigint;
    status: ProposalStatus;
    supportPercent: number;
    title: string;
    totalStakedLamports: bigint;
    votedPercent: number;
};

function mapProposalDetail(
    account: ProposalAccount,
    row: ProposalRow,
    totalStakedLamports: bigint,
    clusterSupportPctMinBps: bigint,
    clusterValidatorCount: number,
    currentEpoch: bigint | undefined,
): ProposalDetailModel {
    const { abstainVotesLamports, againstVotesLamports, clusterSupportLamports, forVotesLamports } = account;
    const requiredSupportLamports = (totalStakedLamports * clusterSupportPctMinBps) / 10_000n;

    return {
        abstainPercent: percentOf(abstainVotesLamports, totalStakedLamports),
        abstainVotesLamports,
        address: account.address,
        againstPercent: percentOf(againstVotesLamports, totalStakedLamports),
        againstVotesLamports,
        author: account.author,
        clusterSupportLamports,
        clusterValidatorCount,
        createdAtMs: row.creationTimestamp * 1000,
        currentEpoch,
        description: account.description,
        forPercent: percentOf(forVotesLamports, totalStakedLamports),
        forVotesLamports,
        nextStageEpoch: row.nextStage?.epoch ?? null,
        numSupporters: account.numSupporters,
        participationPercent: clusterValidatorCount > 0 ? (account.numSupporters / clusterValidatorCount) * 100 : 0,
        proposalRef: row.proposalRef,
        quorumPercent: row.quorumPercent,
        requiredPercent: supportThresholdPercentFromConfig(clusterSupportPctMinBps),
        requiredSupportLamports,
        status: row.status,
        supportPercent: percentOf(clusterSupportLamports, totalStakedLamports),
        title: account.title,
        totalStakedLamports,
        votedPercent: percentOf(forVotesLamports + againstVotesLamports + abstainVotesLamports, totalStakedLamports),
    };
}

export function useProposalDetail(proposalAddress: string) {
    const { currentEpoch, error, isLoading, refetch: refetchRows, rows } = useProposalRows();
    const proposalsQuery = useProposals();
    const voteAccountsQuery = useVoteAccounts();
    const globalConfigQuery = useGlobalConfig();
    const supportsQuery = useSupports();
    const votesQuery = useVotes();
    const stakewizQuery = useStakeWiz();
    const status = rows.find(row => row.address === proposalAddress)?.status;
    const showVotes = status === 'voting' || status === 'finalized';

    const detail = useMemo(() => {
        const row = rows.find(proposalRow => proposalRow.address === proposalAddress);
        const account = proposalsQuery.data?.find(proposalAccount => proposalAccount.address === proposalAddress);
        if (!row || !account || !voteAccountsQuery.data || !globalConfigQuery.data) return undefined;

        let totalStakedLamports = 0n;
        for (const voteAccount of voteAccountsQuery.data) {
            totalStakedLamports += voteAccount.activatedStake;
        }

        return mapProposalDetail(
            account,
            row,
            totalStakedLamports,
            globalConfigQuery.data.clusterSupportPctMinBps,
            voteAccountsQuery.data.length,
            currentEpoch,
        );
    }, [currentEpoch, globalConfigQuery.data, proposalAddress, proposalsQuery.data, rows, voteAccountsQuery.data]);

    const validatorRows = useMemo(() => {
        if (!detail || !voteAccountsQuery.data) return [];

        if (showVotes) {
            if (!votesQuery.data) return [];
            return mapVoteValidatorRows(
                votesQuery.data,
                voteAccountsQuery.data,
                detail.totalStakedLamports,
                stakewizQuery.data,
            );
        }

        if (!supportsQuery.data) return [];
        return mapSupportValidatorRows(
            supportsQuery.data,
            voteAccountsQuery.data,
            detail.totalStakedLamports,
            stakewizQuery.data,
        );
    }, [detail, showVotes, stakewizQuery.data, supportsQuery.data, voteAccountsQuery.data, votesQuery.data]);

    const isNotFound =
        proposalsQuery.data !== undefined &&
        !proposalsQuery.data.some(proposalAccount => proposalAccount.address === proposalAddress);

    const participationPending = showVotes ? votesQuery.data === undefined : supportsQuery.data === undefined;

    return {
        detail,
        error: error ?? supportsQuery.error ?? votesQuery.error ?? null,
        isLoading: (isLoading || voteAccountsQuery.data === undefined || participationPending) && !isNotFound,
        isNotFound,
        refetch: async () => {
            await Promise.all([
                refetchRows(),
                voteAccountsQuery.refetch(),
                supportsQuery.refetch(),
                votesQuery.refetch(),
                stakewizQuery.refetch(),
            ]);
        },
        validatorRows,
    };
}
