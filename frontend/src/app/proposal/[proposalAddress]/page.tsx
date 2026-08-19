import { createSolanaRpc, isAddress } from '@solana/kit';
import { fetchMaybeProposal } from '@solana/svmgov';
import type { Metadata } from 'next';

import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { env } from '@/env';
import { formatProposalHeading, getProposalRefFromUrl } from '@/lib/github';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ proposalAddress: string }>;
}): Promise<Metadata> {
    const { proposalAddress } = await params;
    const title = await fetchProposalDocumentTitle(proposalAddress);
    return title ? { title } : {};
}

export default async function Page({ params }: { params: Promise<{ proposalAddress: string }> }) {
    const { proposalAddress } = await params;

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
            <ProposalDetail proposalAddress={proposalAddress} />
        </main>
    );
}

async function fetchProposalDocumentTitle(proposalAddress: string): Promise<string | undefined> {
    if (!isAddress(proposalAddress)) return undefined;

    try {
        const account = await fetchMaybeProposal(createSolanaRpc(env.NEXT_PUBLIC_SOLANA_RPC_MAINNET), proposalAddress);
        if (!account.exists) return undefined;
        return formatProposalHeading(getProposalRefFromUrl(account.data.description), account.data.title);
    } catch {
        return undefined;
    }
}
