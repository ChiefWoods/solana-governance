import { cn } from '@/lib/utils';
import type { ProposalStatus } from '@/lib/proposals';

import { STATUS_BADGE_CLASS, STATUS_LABELS } from './proposalStatus';

export function StatusBadge({ className, status }: { className?: string; status: ProposalStatus }) {
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
                STATUS_BADGE_CLASS[status],
                className,
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}
