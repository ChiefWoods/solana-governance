'use client';

import { createSolanaRpc } from '@solana/kit';
import { useQuery } from '@tanstack/react-query';

import { useRpc } from '@/contexts/RpcContext';
import type { EpochTiming } from '@/lib/epochTime';
import { QUERY_KEYS } from '@/lib/queryKeys';

const EPOCH_STALE_MS = 5 * 60 * 1000;

export async function fetchEpochTiming(rpcUrl: string): Promise<EpochTiming> {
    const epochInfo = await createSolanaRpc(rpcUrl).getEpochInfo().send();

    return {
        epoch: epochInfo.epoch,
        slotIndex: epochInfo.slotIndex,
        slotsInEpoch: epochInfo.slotsInEpoch,
    };
}

export function useEpochInfo() {
    const { endpointType, endpointUrl } = useRpc();

    return useQuery({
        enabled: Boolean(endpointUrl),
        queryFn: () => fetchEpochTiming(endpointUrl),
        queryKey: [QUERY_KEYS.GET_EPOCH_INFO, endpointType, endpointUrl],
        staleTime: EPOCH_STALE_MS,
    });
}
