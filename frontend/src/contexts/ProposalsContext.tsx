'use client';

import { createSolanaRpc, unwrapOption, type Address } from '@solana/kit';
import { type Proposal } from '@solana/svmgov';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import { useRpc } from '@/contexts/RpcContext';
import { fetchAllProposals } from '@/lib/programAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';

const PROPOSALS_STALE_MS = 1000 * 120; // 2 minutes

export type ProposalAccount = Omit<Proposal, 'consensusResult' | 'discriminator'> & {
    address: Address;
    consensusResult: Address | null;
};

type ProposalsContextValue = UseQueryResult<ProposalAccount[]>;

const ProposalsContext = createContext<ProposalsContextValue | undefined>(undefined);

export function toProposalAccount(account: { address: Address; data: Proposal }): ProposalAccount {
    const { consensusResult, discriminator, ...data } = account.data;
    void discriminator;

    return {
        ...data,
        address: account.address,
        consensusResult: unwrapOption(consensusResult),
    };
}

export async function fetchProposalsFromRpc(rpcUrl: string): Promise<ProposalAccount[]> {
    const accounts = await fetchAllProposals(createSolanaRpc(rpcUrl));

    return accounts.map(toProposalAccount);
}

export function ProposalsProvider({ children }: { children: ReactNode }) {
    const { endpointType, endpointUrl } = useRpc();
    const globalConfigQuery = useGlobalConfig();

    const query = useQuery({
        enabled: globalConfigQuery.isSuccess && Boolean(globalConfigQuery.data) && Boolean(endpointUrl),
        gcTime: PROPOSALS_STALE_MS,
        queryFn: () => fetchProposalsFromRpc(endpointUrl),
        queryKey: [QUERY_KEYS.GET_ALL_PROPOSALS, endpointType, endpointUrl],
        staleTime: PROPOSALS_STALE_MS,
    });

    return <ProposalsContext.Provider value={query}>{children}</ProposalsContext.Provider>;
}

export function useProposals() {
    const context = useContext(ProposalsContext);
    if (context === undefined) {
        throw new Error('useProposals must be used within a ProposalsProvider');
    }
    return context;
}
