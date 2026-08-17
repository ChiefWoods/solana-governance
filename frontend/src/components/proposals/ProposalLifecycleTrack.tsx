import { Check, X } from 'lucide-react';
import { Fragment } from 'react';

import { Separator } from '@/components/ui/separator';
import type { ProposalFailureAt, ProposalStatus } from '@/lib/proposals';
import { cn } from '@/lib/utils';

import { STATUS_BADGE_CLASS } from './proposalStatus';

const LIFECYCLE_STEPS = ['supporting', 'discussion', 'voting'] as const;

type LifecycleStep = (typeof LIFECYCLE_STEPS)[number];
type StepVisual = 'active' | 'failed' | 'passed' | 'pending';

const STEP_LABEL: Record<LifecycleStep, string> = {
    discussion: 'Discussion',
    supporting: 'Support',
    voting: 'Voting',
};

function stepVisual(step: LifecycleStep, status: ProposalStatus, failedAt?: ProposalFailureAt): StepVisual {
    const failedAtVoting = status === 'failed' && failedAt === 'voting';

    if (step === 'supporting') {
        if (status === 'supporting') return 'active';
        if (status === 'failed' && !failedAtVoting) return 'failed';
        return 'passed';
    }

    if (step === 'discussion') {
        if (status === 'discussion') return 'active';
        if (status === 'voting' || status === 'finalized' || failedAtVoting) return 'passed';
        return 'pending';
    }

    if (status === 'voting') return 'active';
    if (status === 'finalized') return 'passed';
    if (failedAtVoting) return 'failed';
    return 'pending';
}

export function ProposalLifecycleTrack({ failedAt, status }: { failedAt?: ProposalFailureAt; status: ProposalStatus }) {
    return (
        <ol className="flex w-full items-center justify-between">
            {LIFECYCLE_STEPS.map((step, index) => {
                const visual = stepVisual(step, status, failedAt);
                const active = visual === 'active';
                const isLast = index === LIFECYCLE_STEPS.length - 1;

                return (
                    <Fragment key={step}>
                        <li className="flex shrink-0 items-center gap-2.5">
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                    visual === 'passed' && 'bg-dao-status-finalized text-background',
                                    visual === 'failed' && STATUS_BADGE_CLASS.failed,
                                    active && STATUS_BADGE_CLASS[status],
                                    visual === 'pending' && 'bg-muted text-muted-foreground',
                                )}
                                aria-current={active ? 'step' : undefined}
                            >
                                {visual === 'passed' ? (
                                    <Check className="size-3.5" aria-hidden />
                                ) : visual === 'failed' ? (
                                    <X className="size-3.5" aria-hidden />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-sm',
                                    active || visual === 'passed' || visual === 'failed'
                                        ? 'font-medium text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {STEP_LABEL[step]}
                            </span>
                        </li>
                        {isLast ? null : (
                            <li aria-hidden className="mx-3 flex min-w-4 flex-1 items-center">
                                <Separator className={cn('w-full', visual === 'passed' && 'bg-dao-status-finalized')} />
                            </li>
                        )}
                    </Fragment>
                );
            })}
        </ol>
    );
}
