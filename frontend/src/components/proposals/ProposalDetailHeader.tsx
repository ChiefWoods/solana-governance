'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

import { CopyButton } from '@/components/CopyButton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { ProposalDetailModel } from '@/hooks/useProposalDetail';
import { useProposalRef } from '@/hooks/useProposalDocument';
import { truncateAddress } from '@/lib/format';

import { ProposalDescription } from './ProposalDescription';
import { ProposalHeading } from './ProposalHeading';

export function ProposalDetailHeader({ proposal }: { proposal: ProposalDetailModel }) {
    const proposalRef = useProposalRef(proposal.description, proposal.proposalRef);
    const breadcrumbLabel = proposalRef?.label ?? truncateAddress(proposal.address);

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/proposals" />}>Proposals</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="min-w-0 font-heading text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl">
                    <ProposalHeading
                        fallback={proposal.proposalRef}
                        title={proposal.title}
                        url={proposal.description}
                    />
                </h1>
                <span className="inline-flex items-center gap-1 font-mono text-sm leading-none text-muted-foreground">
                    {truncateAddress(proposal.address)}
                    <CopyButton label="proposal address" value={proposal.address} />
                </span>
            </div>
            <ProposalDescription
                className="max-h-none w-full overflow-visible pr-0 text-sm leading-relaxed sm:text-base"
                githubUrl={proposal.description}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] font-medium uppercase leading-none tracking-wide">Author</span>
                    <span className="inline-flex items-center gap-1 font-mono leading-none text-foreground">
                        {truncateAddress(proposal.author)}
                        <CopyButton label="author address" value={proposal.author} />
                    </span>
                </span>
                <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
                    <span className="text-[11px] font-medium uppercase leading-none tracking-wide">Created</span>
                    <span className="leading-none">
                        {formatDistanceToNow(proposal.createdAtMs, { addSuffix: true })}
                    </span>
                </span>
                <a
                    href={proposal.description}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open proposal on GitHub"
                    className="inline-flex size-6 items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100"
                >
                    <Image src="/github.svg" alt="" width={18} height={18} className="size-4 invert" />
                </a>
            </div>
        </div>
    );
}
