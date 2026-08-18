'use client';

import { createSolanaRpc, type Address } from '@solana/kit';
import { useQuery } from '@tanstack/react-query';

import { useRpc } from '@/contexts/RpcContext';
import { fetchStakeAccounts } from '@/lib/programAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';

const STAKE_ACCOUNTS_STALE_MS = 60 * 1000;

export function useWalletStakeAccounts(owner: string | undefined) {
    const { endpointType, endpointUrl } = useRpc();

    return useQuery({
        enabled: Boolean(endpointUrl && owner),
        queryFn: () => fetchStakeAccounts(createSolanaRpc(endpointUrl), owner as Address),
        queryKey: [QUERY_KEYS.GET_STAKE_ACCOUNTS, endpointType, endpointUrl, owner],
        staleTime: STAKE_ACCOUNTS_STALE_MS,
    });
}
