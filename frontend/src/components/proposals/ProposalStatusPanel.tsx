'use client';

import { useConnector } from '@solana/connector/react';
import type { ReactNode } from 'react';

import { CastVoteButton } from '@/components/actions/CastVoteButton';
import { FinalizeProposalButton } from '@/components/actions/FinalizeProposalButton';
import { SupportProposalButton } from '@/components/actions/SupportProposalButton';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEpochInfo } from '@/hooks/useEpochInfo';
import type { ProposalDetailModel } from '@/hooks/useProposalDetail';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';
import { estimateMsUntilEpochStart, formatDuration } from '@/lib/epochTime';
import { formatCompactSol, formatPercent } from '@/lib/format';
import { getVotingStageAction } from '@/lib/proposals';

import { HoverTooltip } from './HoverTooltip';
import {
    FAILED_SUPPORT_DESCRIPTION,
    FAILED_VOTING_DESCRIPTION,
    STATUS_DESCRIPTIONS,
    STATUS_TEXT_CLASS,
} from './proposalStatus';

function supportCopy(requiredPercent: number) {
    return `The support phase requires ${requiredPercent}% of total validator stake expressing support for the proposal before it can move on to discussion and voting.`;
}

function EpochCountdown({
    currentEpoch,
    isLoading,
    label,
    nextEpoch,
}: {
    currentEpoch?: bigint;
    isLoading: boolean;
    label: string;
    nextEpoch?: bigint | null;
}) {
    if (isLoading) {
        return <Skeleton className="inline-block h-[1em] w-28 align-middle" aria-label="Loading time remaining" />;
    }

    return (
        <HoverTooltip
            content={`Current epoch ${currentEpoch?.toString() ?? '—'} · next phase epoch ${nextEpoch?.toString() ?? '—'}`}
        >
            <span className="font-semibold text-foreground tabular-nums">{label}</span>
        </HoverTooltip>
    );
}

function Metric({
    hint,
    isLoading = false,
    label,
    value,
}: {
    hint?: string;
    isLoading?: boolean;
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-1 font-heading text-lg font-semibold tracking-tight text-foreground tabular-nums">
                {isLoading ? <Skeleton className="h-6 w-24" aria-label={`Loading ${label.toLowerCase()}`} /> : value}
            </div>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function SupportGauge({
    failed,
    requiredPercent,
    supportPercent,
}: {
    failed?: boolean;
    requiredPercent: number;
    supportPercent: number;
}) {
    const ratio = requiredPercent > 0 ? supportPercent / requiredPercent : 0;

    return (
        <div className="flex shrink-0 items-center gap-3">
            <ProgressRing
                ariaLabel={`Current support ${formatPercent(supportPercent)} of ${formatPercent(requiredPercent)} required`}
                className={failed ? 'text-dao-status-failed' : 'text-dao-status-supporting'}
                size={72}
                stroke={7}
                value={Math.min(100, ratio * 100)}
            />
            <div className="min-w-0">
                <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {formatPercent(supportPercent)}
                </p>
                <p className="text-xs text-muted-foreground">of {formatPercent(requiredPercent)} required</p>
            </div>
        </div>
    );
}

function VoteBar({ className, label, percent }: { className: string; label: string; percent: number }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums text-foreground">{formatPercent(percent, 1)}</span>
            </div>
            <ProgressBar ariaLabel={`${label} ${formatPercent(percent, 1)}`} className={className} value={percent} />
        </div>
    );
}

function StatusPanelLayout({ children }: { children: ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.85fr)]">{children}</div>;
}

function OutcomeTitle({ passed }: { passed: boolean }) {
    return (
        <CardTitle>
            Outcome:{' '}
            <span className={passed ? STATUS_TEXT_CLASS.finalized : STATUS_TEXT_CLASS.failed}>
                {passed ? 'Passed' : 'Failed'}
            </span>
        </CardTitle>
    );
}

function usePhaseCountdown(proposal: ProposalDetailModel) {
    const { data: epochInfo, error } = useEpochInfo();
    const isLoading = epochInfo === undefined && error === null;
    const label =
        proposal.nextStageEpoch && epochInfo
            ? (formatDuration(estimateMsUntilEpochStart(proposal.nextStageEpoch, epochInfo)) ?? '—')
            : '—';

    return { isLoading, label };
}

export function ProposalStatusPanel({ proposal }: { proposal: ProposalDetailModel }) {
    const { isLoading: isCountdownLoading, label: timeRemaining } = usePhaseCountdown(proposal);
    const { isConnected } = useConnector();
    const { isLoading: isRoleLoading, isValidator } = useWalletGovernanceRole();
    const { status } = proposal;

    if (status === 'supporting') {
        return (
            <StatusPanelLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Support</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <SupportGauge
                            requiredPercent={proposal.requiredPercent}
                            supportPercent={proposal.supportPercent}
                        />
                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                            <Metric label="Current support" value={formatCompactSol(proposal.clusterSupportLamports)} />
                            <Metric
                                label="Required"
                                value={formatCompactSol(proposal.requiredSupportLamports)}
                                hint={`${formatCompactSol(proposal.totalStakedLamports, { unit: false })} total staked`}
                            />
                            <Metric
                                label="Time remaining"
                                value={timeRemaining}
                                isLoading={isCountdownLoading}
                                hint={
                                    proposal.nextStageEpoch ? `Epoch ${proposal.nextStageEpoch.toString()}` : undefined
                                }
                            />
                            <Metric
                                label="Validators Participated"
                                value={`${proposal.numSupporters}`}
                                hint={`${formatPercent(proposal.participationPercent, 1)} of cluster`}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Show support</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {supportCopy(proposal.requiredPercent)}
                        </p>
                        <SupportProposalButton
                            className="w-full whitespace-normal"
                            proposalAddress={proposal.address}
                        />
                    </CardContent>
                </Card>
            </StatusPanelLayout>
        );
    }

    if (status === 'discussion') {
        return (
            <StatusPanelLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Discussion</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <SupportGauge
                            requiredPercent={proposal.requiredPercent}
                            supportPercent={proposal.supportPercent}
                        />
                        <div className="min-w-0 sm:text-right">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Voting starts in
                            </p>
                            <div className="mt-1 font-heading text-2xl font-semibold tracking-tight tabular-nums">
                                <EpochCountdown
                                    currentEpoch={proposal.currentEpoch}
                                    isLoading={isCountdownLoading}
                                    label={timeRemaining}
                                    nextEpoch={proposal.nextStageEpoch}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>What happens next</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {STATUS_DESCRIPTIONS.discussion}
                        </p>
                    </CardContent>
                </Card>
            </StatusPanelLayout>
        );
    }

    if (status === 'voting') {
        const votingStageAction = getVotingStageAction(proposal);
        const canFinalize = votingStageAction === 'finalize';
        const disableOverrideVote = isConnected && !isRoleLoading && !isValidator;

        return (
            <StatusPanelLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Votes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <VoteBar label="For" percent={proposal.forPercent} className="bg-dao-status-finalized" />
                        <VoteBar label="Against" percent={proposal.againstPercent} className="bg-dao-status-failed" />
                        <VoteBar label="Abstain" percent={proposal.abstainPercent} className="bg-muted-foreground/60" />
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                            <span className="text-muted-foreground">Quorum</span>
                            <span className="tabular-nums text-foreground">
                                {proposal.votedPercent === undefined ? '—' : formatPercent(proposal.votedPercent, 1)} of{' '}
                                {formatPercent(proposal.quorumPercent)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{canFinalize ? 'Finalize proposal' : 'Cast your vote'}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">{STATUS_DESCRIPTIONS.voting}</p>
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                {canFinalize ? (
                                    'Voting period has ended.'
                                ) : (
                                    <>
                                        Voting ends in{' '}
                                        <EpochCountdown
                                            currentEpoch={proposal.currentEpoch}
                                            isLoading={isCountdownLoading}
                                            label={timeRemaining}
                                            nextEpoch={proposal.nextStageEpoch}
                                        />
                                    </>
                                )}
                            </div>
                            {canFinalize ? (
                                <FinalizeProposalButton
                                    className="w-full whitespace-normal"
                                    finalized={proposal.finalized}
                                    proposalAddress={proposal.address}
                                />
                            ) : (
                                <CastVoteButton
                                    className="w-full whitespace-normal"
                                    disabled={disableOverrideVote}
                                    proposalAddress={proposal.address}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </StatusPanelLayout>
        );
    }

    if (status === 'failed' && proposal.failedAt === 'voting') {
        return (
            <StatusPanelLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Votes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <VoteBar label="For" percent={proposal.forPercent} className="bg-dao-status-finalized" />
                        <VoteBar label="Against" percent={proposal.againstPercent} className="bg-dao-status-failed" />
                        <VoteBar label="Abstain" percent={proposal.abstainPercent} className="bg-muted-foreground/60" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <OutcomeTitle passed={false} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{FAILED_VOTING_DESCRIPTION}</p>
                    </CardContent>
                </Card>
            </StatusPanelLayout>
        );
    }

    if (status === 'failed') {
        return (
            <StatusPanelLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Support</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-4">
                        <SupportGauge
                            failed
                            requiredPercent={proposal.requiredPercent}
                            supportPercent={proposal.supportPercent}
                        />
                        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {STATUS_DESCRIPTIONS.failed}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <OutcomeTitle passed={false} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{FAILED_SUPPORT_DESCRIPTION}</p>
                    </CardContent>
                </Card>
            </StatusPanelLayout>
        );
    }

    return (
        <StatusPanelLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Votes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <VoteBar label="For" percent={proposal.forPercent} className="bg-dao-status-finalized" />
                    <VoteBar label="Against" percent={proposal.againstPercent} className="bg-dao-status-failed" />
                    <VoteBar label="Abstain" percent={proposal.abstainPercent} className="bg-muted-foreground/60" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <OutcomeTitle passed />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{STATUS_DESCRIPTIONS.finalized}</p>
                    <FinalizeProposalButton
                        className="w-full whitespace-normal"
                        finalized={proposal.finalized}
                        proposalAddress={proposal.address}
                    />
                </CardContent>
            </Card>
        </StatusPanelLayout>
    );
}
