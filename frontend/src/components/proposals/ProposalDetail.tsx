'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportsProvider } from '@/contexts/SupportsContext';
import { VotesProvider } from '@/contexts/VotesContext';
import { useProposalDetail, type ProposalDetailModel } from '@/hooks/useProposalDetail';
import type { SupportingValidatorRow } from '@/lib/proposalValidators';

import { ProposalDetailHeader } from './ProposalDetailHeader';
import { ProposalLifecycleTrack } from './ProposalLifecycleTrack';
import { ProposalStatusPanel } from './ProposalStatusPanel';
import { SupportingValidatorsTable } from './SupportingValidatorsTable';

function ProposalDetailSkeleton() {
    return (
        <div className="space-y-8" aria-busy aria-label="Loading proposal">
            <Skeleton className="h-4 w-40" />
            <div className="space-y-3">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-4 w-full max-w-3xl" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.85fr)]">
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-56 rounded-xl" />
            </div>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    );
}

export function ProposalDetailLayout({
    onRefresh,
    proposal,
    rows = [],
}: {
    onRefresh?: () => Promise<unknown> | void;
    proposal: ProposalDetailModel;
    rows?: SupportingValidatorRow[];
}) {
    return (
        <div className="space-y-8">
            <ProposalDetailHeader proposal={proposal} />
            <ProposalStatusPanel proposal={proposal} />
            <section className="rounded-xl border border-border bg-card/40 px-4 py-4 sm:px-5">
                <ProposalLifecycleTrack failedAt={proposal.failedAt} status={proposal.status} />
            </section>
            <SupportingValidatorsTable
                key={`${proposal.status}-${proposal.failedAt ?? ''}`}
                failedAt={proposal.failedAt}
                onRefresh={onRefresh}
                rows={rows}
                status={proposal.status}
            />
        </div>
    );
}

export function ProposalDetail({ proposalAddress }: { proposalAddress: string }) {
    return (
        <SupportsProvider proposalAddress={proposalAddress}>
            <VotesProvider proposalAddress={proposalAddress}>
                <ProposalDetailContent proposalAddress={proposalAddress} />
            </VotesProvider>
        </SupportsProvider>
    );
}

function ProposalDetailContent({ proposalAddress }: { proposalAddress: string }) {
    const { detail, error, isLoading, isNotFound, refetch, validatorRows } = useProposalDetail(proposalAddress);

    if (isLoading) {
        return <ProposalDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-muted-foreground">Unable to load this proposal.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                    Try again
                </Button>
            </div>
        );
    }

    if (isNotFound || !detail) {
        return (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-muted-foreground">This proposal was not found.</p>
                <Button nativeButton={false} render={<Link href="/proposals" />} variant="outline" size="sm">
                    Back to proposals
                </Button>
            </div>
        );
    }

    return <ProposalDetailLayout onRefresh={refetch} proposal={detail} rows={validatorRows} />;
}
