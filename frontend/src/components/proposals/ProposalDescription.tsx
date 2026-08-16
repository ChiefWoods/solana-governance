import { Skeleton } from '@/components/ui/skeleton';
import { useProposalDocument } from '@/hooks/useProposalDocument';
import { cn } from '@/lib/utils';

import { ProposalSummaryMarkdown } from './ProposalSummaryMarkdown';

export function ProposalDescription({ className, githubUrl }: { className?: string; githubUrl: string }) {
    const { data, isLoading } = useProposalDocument(githubUrl);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        );
    }

    if (!data?.summary) {
        return null;
    }

    return (
        <div
            className={cn(
                'max-h-48 min-w-0 overflow-x-hidden overflow-y-auto pr-2 text-sm leading-relaxed wrap-break-word text-muted-foreground scrollbar-thin',
                className,
            )}
        >
            <ProposalSummaryMarkdown summary={data.summary} />
        </div>
    );
}
