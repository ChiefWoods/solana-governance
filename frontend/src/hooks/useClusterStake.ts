'use client';

import { createSolanaRpc } from '@solana/kit';
import { useQuery } from '@tanstack/react-query';

import { useRpc } from '@/contexts/RpcContext';
import { QUERY_KEYS } from '@/lib/queryKeys';

const CLUSTER_STAKE_STALE_MS = 5 * 60 * 1000;

export async function fetchClusterStake(rpcUrl: string): Promise<number> {
    const { current } = await createSolanaRpc(rpcUrl).getVoteAccounts().send();
    let total = BigInt(0);
    for (const account of current) {
        total += account.activatedStake;
    }
    return Number(total);
}

export function useClusterStake() {
    const { endpointType, endpointUrl } = useRpc();

    return useQuery({
        enabled: Boolean(endpointUrl),
        queryFn: () => fetchClusterStake(endpointUrl),
        queryKey: [QUERY_KEYS.GET_CLUSTER_STAKE, endpointType, endpointUrl],
        staleTime: CLUSTER_STAKE_STALE_MS,
    });
}
