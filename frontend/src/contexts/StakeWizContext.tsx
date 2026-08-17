'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

import { QUERY_KEYS } from '@/lib/queryKeys';
import { getStakeWizValidators, type Validator } from '@/lib/stakewiz';

const STAKEWIZ_STALE_MS = 5 * 60 * 1000;

type StakeWizContextValue = UseQueryResult<Validator[]>;

const StakeWizContext = createContext<StakeWizContextValue | undefined>(undefined);

export function StakeWizProvider({ children }: { children: ReactNode }) {
    const query = useQuery({
        gcTime: STAKEWIZ_STALE_MS,
        queryFn: getStakeWizValidators,
        queryKey: [QUERY_KEYS.GET_STAKEWIZ_VALIDATORS],
        retry: 1,
        staleTime: STAKEWIZ_STALE_MS,
    });

    return <StakeWizContext.Provider value={query}>{children}</StakeWizContext.Provider>;
}

export function useStakeWiz() {
    const context = useContext(StakeWizContext);
    if (context === undefined) {
        throw new Error('useStakeWiz must be used within a StakeWizProvider');
    }
    return context;
}
