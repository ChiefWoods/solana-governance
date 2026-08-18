'use client';

import { useQuery } from '@tanstack/react-query';

import { useNcnApi } from '@/contexts/NcnApiContext';
import { useRpc } from '@/contexts/RpcContext';
import { QUERY_KEYS } from '@/lib/queryKeys';

const SNAPSHOT_META_STALE_MS = 60 * 1000;

export function useSnapshotMeta() {
    const { network } = useRpc();
    const { ncnApiUrl, ncnVerifierService } = useNcnApi();

    return useQuery({
        enabled: network !== 'localnet' && Boolean(ncnApiUrl),
        queryFn: () => {
            if (network === 'localnet') {
                throw new Error('Snapshot meta is not available on localnet');
            }
            return ncnVerifierService.getMeta(network);
        },
        queryKey: [QUERY_KEYS.GET_SNAPSHOT_META, ncnApiUrl, network],
        retry: 1,
        staleTime: SNAPSHOT_META_STALE_MS,
    });
}
