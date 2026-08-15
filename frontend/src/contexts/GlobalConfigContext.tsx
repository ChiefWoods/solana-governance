'use client';

import { createSolanaRpc, unwrapOption, type Address } from '@solana/kit';
import { fetchGlobalConfig, findGlobalConfigPda, type GlobalConfig } from '@solana/svmgov';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

import { useRpc } from '@/contexts/RpcContext';
import { QUERY_KEYS } from '@/lib/queryKeys';

const GLOBAL_CONFIG_STALE_MS = 60 * 60 * 1000; // 1 hour

export type GlobalConfigAccount = Omit<GlobalConfig, 'discriminator' | 'pendingAdmin'> & {
    address: Address;
    pendingAdmin: Address | null;
};

type GlobalConfigContextValue = UseQueryResult<GlobalConfigAccount>;

const GlobalConfigContext = createContext<GlobalConfigContextValue | undefined>(undefined);

export async function fetchGlobalConfigFromRpc(rpcUrl: string): Promise<GlobalConfigAccount> {
    const rpc = createSolanaRpc(rpcUrl);
    const [pda] = await findGlobalConfigPda();
    const account = await fetchGlobalConfig(rpc, pda);
    const { discriminator, pendingAdmin, ...data } = account.data;
    void discriminator;

    return {
        ...data,
        address: account.address,
        pendingAdmin: unwrapOption(pendingAdmin),
    };
}

export function GlobalConfigProvider({ children }: { children: ReactNode }) {
    const { endpointType, endpointUrl } = useRpc();

    const query = useQuery({
        enabled: Boolean(endpointUrl),
        gcTime: GLOBAL_CONFIG_STALE_MS,
        queryFn: () => fetchGlobalConfigFromRpc(endpointUrl),
        queryKey: [QUERY_KEYS.GET_GOVERNANCE_CONFIG, endpointType, endpointUrl],
        staleTime: GLOBAL_CONFIG_STALE_MS,
    });

    return <GlobalConfigContext.Provider value={query}>{children}</GlobalConfigContext.Provider>;
}

export function useGlobalConfig() {
    const context = useContext(GlobalConfigContext);
    if (context === undefined) {
        throw new Error('useGlobalConfig must be used within a GlobalConfigProvider');
    }
    return context;
}
