'use client';

import { createSolanaRpc, isAddress, type Address } from '@solana/kit';
import { type Vote } from '@solana/svmgov';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

import { useRpc } from '@/contexts/RpcContext';
import { fetchProposalVotes } from '@/lib/programAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';

const VOTES_STALE_MS = 1000 * 60;

export type VoteAccount = Omit<Vote, 'discriminator'> & {
    address: Address;
};

type VotesContextValue = UseQueryResult<VoteAccount[]>;

const VotesContext = createContext<VotesContextValue | undefined>(undefined);

export function toVoteAccount(account: { address: Address; data: Vote }): VoteAccount {
    const { discriminator, ...data } = account.data;
    void discriminator;

    return {
        ...data,
        address: account.address,
    };
}

export async function fetchVotesFromRpc(rpcUrl: string, proposalAddress: Address): Promise<VoteAccount[]> {
    const accounts = await fetchProposalVotes(createSolanaRpc(rpcUrl), proposalAddress);
    return accounts.map(toVoteAccount);
}

export function VotesProvider({ children, proposalAddress }: { children: ReactNode; proposalAddress: string }) {
    const { endpointType, endpointUrl } = useRpc();

    const query = useQuery({
        enabled: Boolean(endpointUrl) && isAddress(proposalAddress),
        gcTime: VOTES_STALE_MS,
        queryFn: () => fetchVotesFromRpc(endpointUrl, proposalAddress as Address),
        queryKey: [QUERY_KEYS.GET_PROPOSAL_VOTES, endpointType, endpointUrl, proposalAddress],
        staleTime: VOTES_STALE_MS,
    });

    return <VotesContext.Provider value={query}>{children}</VotesContext.Provider>;
}

export function useVotes() {
    const context = useContext(VotesContext);
    if (context === undefined) {
        throw new Error('useVotes must be used within a VotesProvider');
    }
    return context;
}
