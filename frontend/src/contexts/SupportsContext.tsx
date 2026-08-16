'use client';

import { createSolanaRpc, isAddress, type Address } from '@solana/kit';
import { type Support } from '@solana/svmgov';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

import { useRpc } from '@/contexts/RpcContext';
import { fetchProposalSupports } from '@/lib/programAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';

const SUPPORTS_STALE_MS = 1000 * 60;

export type SupportAccount = Omit<Support, 'discriminator'> & {
    address: Address;
};

type SupportsContextValue = UseQueryResult<SupportAccount[]>;

const SupportsContext = createContext<SupportsContextValue | undefined>(undefined);

export function toSupportAccount(account: { address: Address; data: Support }): SupportAccount {
    const { discriminator, ...data } = account.data;
    void discriminator;

    return {
        ...data,
        address: account.address,
    };
}

export async function fetchSupportsFromRpc(rpcUrl: string, proposalAddress: Address): Promise<SupportAccount[]> {
    const accounts = await fetchProposalSupports(createSolanaRpc(rpcUrl), proposalAddress);
    return accounts.map(toSupportAccount);
}

export function SupportsProvider({ children, proposalAddress }: { children: ReactNode; proposalAddress: string }) {
    const { endpointType, endpointUrl } = useRpc();

    const query = useQuery({
        enabled: Boolean(endpointUrl) && isAddress(proposalAddress),
        gcTime: SUPPORTS_STALE_MS,
        queryFn: () => fetchSupportsFromRpc(endpointUrl, proposalAddress as Address),
        queryKey: [QUERY_KEYS.GET_PROPOSAL_SUPPORTS, endpointType, endpointUrl, proposalAddress],
        staleTime: SUPPORTS_STALE_MS,
    });

    return <SupportsContext.Provider value={query}>{children}</SupportsContext.Provider>;
}

export function useSupports() {
    const context = useContext(SupportsContext);
    if (context === undefined) {
        throw new Error('useSupports must be used within a SupportsProvider');
    }
    return context;
}
