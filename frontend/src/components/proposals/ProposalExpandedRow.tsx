'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import type { ProposalRow } from '@/hooks/useProposalRows';
import { supportThresholdPercentFromConfig } from '@/lib/proposals';

import { ProposalDescription } from './ProposalDescription';
import { ProposalHeading } from './ProposalHeading';
import { STATUS_DESCRIPTIONS } from './proposalStatus';
import { StatusBadge } from './StatusBadge';

const STAGE_LABEL_CLASS =
    'shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground';

export function ProposalExpandedRow({ proposal }: { proposal: ProposalRow }) {
    const { data: globalConfig } = useGlobalConfig();
    const thresholdPercent = supportThresholdPercentFromConfig(globalConfig?.clusterSupportPctMinBps);
    const description =
        proposal.status === 'supporting'
            ? `The support phase requires ${thresholdPercent}% of total validator stake expressing support for the proposal before it can move on to discussion and voting phase.`
            : STATUS_DESCRIPTIONS[proposal.status];

    return (
        <div className="flex w-full min-w-0 flex-col gap-4 overflow-x-hidden p-4 sm:gap-6 sm:p-6 lg:flex-row lg:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
                <div className="min-w-0 space-y-3">
                    <div className="flex min-w-0 items-start gap-2">
                        <h3 className="min-w-0 flex-1 wrap-break-word text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                            <ProposalHeading
                                fallback={proposal.proposalRef}
                                title={proposal.title}
                                url={proposal.description}
                            />
                        </h3>
                        <a
                            href={proposal.description}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open proposal on GitHub"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100"
                        >
                            <Image src="/github.svg" alt="" width={20} height={20} className="size-5 invert" />
                        </a>
                    </div>
                    <ProposalDescription githubUrl={proposal.description} />
                </div>
            </div>
            <aside className="flex w-full min-w-0 flex-col justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 sm:gap-5 sm:p-5 lg:w-80 lg:shrink-0">
                <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
                    <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                            <span className={STAGE_LABEL_CLASS}>Current Stage</span>
                            <StatusBadge status={proposal.status} />
                        </div>
                        {proposal.nextStage && (
                            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                                <span className={STAGE_LABEL_CLASS}>Next Stage</span>
                                <StatusBadge className="px-2 py-0.5" status={proposal.nextStage.status} />
                            </div>
                        )}
                    </div>
                    <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
                <Button
                    nativeButton={false}
                    render={<Link href={`/proposal/${proposal.address}`} />}
                    variant="outline"
                    className="w-full"
                >
                    View Proposal
                    <ArrowRight data-icon="inline-end" />
                </Button>
            </aside>
        </div>
    );
}
