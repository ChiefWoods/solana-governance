import { Skeleton } from '@/components/ui/skeleton';
import { useProposalDocument } from '@/hooks/useProposalDocument';
import { formatProposalHeading, type ProposalRef } from '@/lib/github';

export function ProposalHeading({
    fallback,
    title,
    url,
}: {
    fallback?: ProposalRef;
    title: string;
    url: string;
}) {
    const { data, isLoading } = useProposalDocument(url);
    const proposalRef = data?.ref ?? fallback;

    if (isLoading && !proposalRef && !title) {
        return <Skeleton className="h-6 w-2/3" aria-label="Loading proposal title" />;
    }

    return <>{formatProposalHeading(proposalRef, title)}</>;
}
