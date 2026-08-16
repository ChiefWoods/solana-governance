import type { ProposalStatus, VoteProgress } from '@/lib/proposals';
import { cn } from '@/lib/utils';

import { HoverTooltip } from './HoverTooltip';
import { STATUS_TEXT_CLASS } from './proposalStatus';

const SIZE = 22;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StatusProgressRing({
    progress,
    status,
}: {
    progress: VoteProgress;
    status: ProposalStatus;
}) {
    const percent = Math.round(progress.ratio * 100);

    return (
        <HoverTooltip className={STATUS_TEXT_CLASS[status]} content={`${percent}% of quorum`}>
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className={cn('mx-auto', STATUS_TEXT_CLASS[status])}
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="img"
                aria-label={`Voting progress: ${percent}% of quorum`}
            >
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={STROKE}
                    className="opacity-20"
                />
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - progress.ratio)}
                    className="-rotate-90 origin-center transition-[stroke-dashoffset] duration-500"
                />
            </svg>
        </HoverTooltip>
    );
}
