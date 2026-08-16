'use client';

import type { ProposalStatus } from '@/lib/proposals';
import { cn } from '@/lib/utils';

import { HoverTooltip } from './HoverTooltip';
import { STAGE_CIRCLES, STATUS_DOT_CLASS, STATUS_LABELS, STATUS_TEXT_CLASS, type StageCircle } from './proposalStatus';

function activeCircle(status: ProposalStatus): StageCircle {
    return status === 'finalized' || status === 'failed' ? 'outcome' : status;
}

function circleColor(status: ProposalStatus, circle: StageCircle): string {
    if (activeCircle(status) !== circle) {
        return 'bg-muted-foreground/20';
    }
    return STATUS_DOT_CLASS[status];
}

export function StatusStageCircles({ status }: { status: ProposalStatus }) {
    const label = STATUS_LABELS[status];

    return (
        <HoverTooltip className={STATUS_TEXT_CLASS[status]} content={label}>
            <span className="inline-flex items-center justify-center gap-1.5" aria-label={label}>
                {STAGE_CIRCLES.map(circle => (
                    <span
                        key={circle}
                        aria-hidden
                        className={cn('size-2.5 rounded-full transition-colors', circleColor(status, circle))}
                    />
                ))}
            </span>
        </HoverTooltip>
    );
}
