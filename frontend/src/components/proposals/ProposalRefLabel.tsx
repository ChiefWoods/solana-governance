'use client';

import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useProposalDocument } from '@/hooks/useProposalDocument';
import type { ProposalRef } from '@/lib/github';

import { HoverTooltip } from './HoverTooltip';

const TITLE_CODE_PREFIX = /^#?\s*(?:simd|sgp)[\s-]*0*\d{1,5}\s*[:\-–]?\s*/i;

function proposalName(title: string): string {
    return title.replace(TITLE_CODE_PREFIX, '').trim() || title;
}

export function ProposalRefLabel({
    className,
    fallback,
    placeholder = '—',
    title,
    url,
}: {
    className?: string;
    fallback?: ProposalRef;
    placeholder?: ReactNode;
    title?: string;
    url: string;
}) {
    const { data, isLoading } = useProposalDocument(url);
    const proposalRef = data?.ref ?? fallback;

    if (!proposalRef) {
        if (isLoading) {
            return <Skeleton className="h-4 w-20" aria-label="Loading proposal" />;
        }
        return placeholder === null ? null : <span className={className}>{placeholder}</span>;
    }

    const label = <span className={className}>{proposalRef.label}</span>;
    if (!title) return label;

    return (
        <HoverTooltip className="max-w-xs" content={proposalName(title)}>
            {label}
        </HoverTooltip>
    );
}
