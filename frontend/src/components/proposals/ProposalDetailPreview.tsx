'use client';

// EPHEMERAL: layout preview only — do not commit.

import type { Address } from '@solana/kit';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SupportsProvider } from '@/contexts/SupportsContext';
import { VotesProvider } from '@/contexts/VotesContext';
import type { ProposalDetailModel } from '@/hooks/useProposalDetail';
import { showsVoteResults, type ProposalFailureAt, type ProposalStatus } from '@/lib/proposals';
import type { SupportingValidatorRow } from '@/lib/proposalValidators';
import { cn } from '@/lib/utils';

import { ProposalDetailLayout } from './ProposalDetail';
import { STATUS_DOT_CLASS, STATUS_LABELS } from './proposalStatus';

type PreviewView = ProposalStatus | 'failed-voting';

const PREVIEW_VIEWS: { failedAt?: ProposalFailureAt; id: PreviewView; label: string; status: ProposalStatus }[] = [
    { id: 'supporting', label: STATUS_LABELS.supporting, status: 'supporting' },
    { id: 'discussion', label: STATUS_LABELS.discussion, status: 'discussion' },
    { id: 'voting', label: STATUS_LABELS.voting, status: 'voting' },
    { id: 'finalized', label: STATUS_LABELS.finalized, status: 'finalized' },
    { failedAt: 'support', id: 'failed', label: 'Failed support', status: 'failed' },
    { failedAt: 'voting', id: 'failed-voting', label: 'Failed voting', status: 'failed' },
];

const PREVIEW_ADDRESS = 'SgpAccountexample111111111111111111111111111' as Address;
const AUTHOR_ADDRESS = '2X5y7kQ9mN4pR8sT1vWxyzABCDEFGHJKLMnoPQRSTUV' as Address;
const GITHUB_URL = 'https://github.com/solana-foundation/solana-governance-proposals';
const JUPITER_LOGO = 'https://static.jup.ag/jup/icon.png';

const TOTAL_STAKED_LAMPORTS = 435_490_000_000_000_000n;
const REQUIRED_SUPPORT_LAMPORTS = 65_320_000_000_000_000n;
const MET_SUPPORT_LAMPORTS = 67_260_000_000_000_000n;
const LOW_SUPPORT_LAMPORTS = 35_710_000_000_000_000n;

const NAMED_PEOPLE: SupportingValidatorRow[] = [
    {
        address: 'JUPiTEr1aFa6mSoLEBdbxG6Kfi9W7y44o7CsrS9Vpump',
        logo: JUPITER_LOGO,
        name: 'Jupiter',
        percent: '2.87%',
        stake: '12,490,000',
        vote: 'For',
    },
    {
        address: 'STAKE1FacilitiesMEV111111111111111111111111',
        name: 'Staking Facilities | MEV',
        percent: '1.51%',
        stake: '6,590,000',
        vote: 'Against',
    },
];

const EXTRA_PEOPLE: SupportingValidatorRow[] = Array.from({ length: 22 }, (_, index) => {
    const millions = 3.5 - index * 0.08;
    return {
        address: `Val${String(index + 1).padStart(2, '0')}Unknown222333444555666777888999000aaa`,
        name: 'Unknown',
        percent: `${(0.8 - index * 0.02).toFixed(2)}%`,
        stake: (millions * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 }),
        vote: index % 5 === 0 ? 'Abstain' : index % 3 === 0 ? 'Against' : 'For',
    };
});

const PREVIEW_SUPPORTERS: SupportingValidatorRow[] = [...NAMED_PEOPLE, ...EXTRA_PEOPLE];
const PREVIEW_VOTERS: SupportingValidatorRow[] = PREVIEW_SUPPORTERS.slice(0, 16);

const VOTE_SAMPLE = {
    'failed-voting': { abstainPercent: 6.1, againstPercent: 32.6, forPercent: 24.8, votedPercent: 63.5 },
    finalized: { abstainPercent: 4, againstPercent: 9.1, forPercent: 48.6, votedPercent: 61.7 },
    voting: { abstainPercent: 3.2, againstPercent: 11.4, forPercent: 42.1, votedPercent: 56.7 },
} as const;

function voteSample(status: ProposalStatus, failedAt?: ProposalFailureAt) {
    if (failedAt === 'voting') return VOTE_SAMPLE['failed-voting'];
    if (status === 'voting' || status === 'finalized') return VOTE_SAMPLE[status];
    return { abstainPercent: 0, againstPercent: 0, forPercent: 0, votedPercent: 0 };
}

function previewProposal(status: ProposalStatus, failedAt?: ProposalFailureAt): ProposalDetailModel {
    const failedSupport = status === 'failed' && failedAt !== 'voting';
    const votes = voteSample(status, failedAt);

    return {
        abstainPercent: votes.abstainPercent,
        abstainVotesLamports: 0n,
        address: PREVIEW_ADDRESS,
        againstPercent: votes.againstPercent,
        againstVotesLamports: 0n,
        author: AUTHOR_ADDRESS,
        clusterSupportLamports: failedSupport ? LOW_SUPPORT_LAMPORTS : MET_SUPPORT_LAMPORTS,
        clusterValidatorCount: 698,
        createdAtMs: Date.now() - 10 * 24 * 60 * 60 * 1000,
        currentEpoch: 1017n,
        description: GITHUB_URL,
        failedAt,
        forPercent: votes.forPercent,
        forVotesLamports: 0n,
        nextStageEpoch: status === 'finalized' || status === 'failed' ? null : 1021n,
        numSupporters: 74,
        participationPercent: 10.6,
        proposalRef: { kind: 'sgp', label: 'SGP-0001', number: '0001' },
        quorumPercent: 60,
        requiredPercent: 15,
        requiredSupportLamports: REQUIRED_SUPPORT_LAMPORTS,
        status,
        supportPercent: failedSupport ? 8.2 : 15.45,
        title: 'SGP-0001: The Solana Constitution',
        totalStakedLamports: TOTAL_STAKED_LAMPORTS,
        votedPercent: votes.votedPercent,
    };
}

export function ProposalDetailPreview() {
    const [view, setView] = useState<PreviewView>('supporting');
    const selected = PREVIEW_VIEWS.find(option => option.id === view) ?? PREVIEW_VIEWS[0];
    const proposal = useMemo(
        () => previewProposal(selected.status, selected.failedAt),
        [selected.failedAt, selected.status],
    );
    const rows = showsVoteResults(selected.status, selected.failedAt) ? PREVIEW_VOTERS : PREVIEW_SUPPORTERS;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
                <p className="text-sm text-muted-foreground">Layout preview with sample data</p>
                <div className="flex flex-wrap gap-1.5">
                    {PREVIEW_VIEWS.map(option => (
                        <Button
                            key={option.id}
                            type="button"
                            size="sm"
                            variant={view === option.id ? 'secondary' : 'ghost'}
                            aria-pressed={view === option.id}
                            onClick={() => setView(option.id)}
                        >
                            <span className={cn('size-1.5 rounded-full', STATUS_DOT_CLASS[option.status])} />
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
            <SupportsProvider proposalAddress={proposal.address}>
                <VotesProvider proposalAddress={proposal.address}>
                    <ProposalDetailLayout proposal={proposal} rows={rows} />
                </VotesProvider>
            </SupportsProvider>
        </div>
    );
}
