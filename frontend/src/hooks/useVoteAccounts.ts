'use client';

import { createSolanaRpc } from '@solana/kit';
import { useQuery } from '@tanstack/react-query';

import { useRpc } from '@/contexts/RpcContext';
import { QUERY_KEYS } from '@/lib/queryKeys';

const VOTE_ACCOUNTS_STALE_MS = 5 * 60 * 1000;

export async function fetchVoteAccounts(rpcUrl: string) {
    const { current } = await createSolanaRpc(rpcUrl).getVoteAccounts().send();
    return current;
}

export function useVoteAccounts() {
    const { endpointType, endpointUrl } = useRpc();

    return useQuery({
        enabled: Boolean(endpointUrl),
        queryFn: () => fetchVoteAccounts(endpointUrl),
        queryKey: [QUERY_KEYS.GET_VOTE_ACCOUNTS, endpointType, endpointUrl],
        staleTime: VOTE_ACCOUNTS_STALE_MS,
    });
}
