'use client';

import { useMemo } from 'react';

import { fetchVoteAccounts, useVoteAccounts } from '@/hooks/useVoteAccounts';

export async function fetchClusterStake(rpcUrl: string): Promise<number> {
    const accounts = await fetchVoteAccounts(rpcUrl);
    let total = BigInt(0);
    for (const account of accounts) {
        total += account.activatedStake;
    }
    return Number(total);
}

export function useClusterStake() {
    const query = useVoteAccounts();
    const data = useMemo(() => {
        if (!query.data) return undefined;
        let total = BigInt(0);
        for (const account of query.data) {
            total += account.activatedStake;
        }
        return Number(total);
    }, [query.data]);

    return { ...query, data };
}
