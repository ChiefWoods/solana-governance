'use client';

import { captureException } from '@sentry/nextjs';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { type ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalConfigProvider } from '@/contexts/GlobalConfigContext';
import { NcnApiProvider } from '@/contexts/NcnApiContext';
import { ProposalsProvider } from '@/contexts/ProposalsContext';
import { RpcProvider } from '@/contexts/RpcContext';
import { StakeWizProvider } from '@/contexts/StakeWizContext';
import { parseWithBigInt, stringifyWithBigInt } from '@/lib/localStorageJson';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { SolanaProvider } from '@/providers/SolanaProvider';

const QUERY_CLIENT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour (aligns with useGovernanceConfig stale time)

/**
 * Browsers reject `fetch` with a bare `TypeError` when the request never completed, and the
 * message is engine specific: "Load failed" (Safari/WebKit), "Failed to fetch" (Chrome),
 * "NetworkError when attempting to fetch resource" (Firefox), "fetch failed" (Node/undici).
 */
const isNetworkFailure = (error: unknown): boolean =>
    error instanceof TypeError &&
    /load failed|failed to fetch|fetch failed|networkerror|network request failed/i.test(error.message);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 10,
            refetchOnWindowFocus: false,
        },
    },
    queryCache: new QueryCache({
        // Fires once per query after its retries are exhausted, never for cancellations.
        onError: (error, query) => {
            console.error('Query error:', error);

            const queryKey = String(query.queryKey[0]);
            // Proposal documents are fetched from GitHub, which is outside our control and rate
            // limited per IP. A failure there degrades to showing just the raw link, so it is not
            // worth an alert.
            if (queryKey === QUERY_KEYS.GET_PROPOSAL_DOCUMENT) return;
            // StakeWiz names/logos are decorative. A failure degrades to "Unknown".
            if (queryKey === QUERY_KEYS.GET_STAKEWIZ_VALIDATORS) return;

            const tags = { query_key: queryKey };

            // Upstream being unreachable is an infrastructure event, not a bug in the app. Report
            // it as a warning and collapse it to one issue per query, otherwise a single outage
            // buries everything else.
            if (isNetworkFailure(error)) {
                captureException(error, {
                    level: 'warning',
                    tags: { ...tags, failure_kind: 'network' },
                    fingerprint: ['network-failure', queryKey],
                });
                return;
            }

            captureException(error, { tags });
        },
    }),
});

const queryClientPersister = createAsyncStoragePersister({
    deserialize: parseWithBigInt,
    key: 'REACT_QUERY_GOVERNANCE_CONFIG',
    serialize: stringifyWithBigInt,
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
});

export function Providers({ children }: { children: ReactNode }) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: queryClientPersister,
                maxAge: QUERY_CLIENT_MAX_AGE_MS,
                dehydrateOptions: {
                    shouldDehydrateQuery: query => query.queryKey[0] === QUERY_KEYS.GET_GOVERNANCE_CONFIG,
                },
            }}
        >
            <StakeWizProvider>
                <RpcProvider>
                    <NcnApiProvider>
                        <GlobalConfigProvider>
                            <ProposalsProvider>
                                <SolanaProvider>
                                    <TooltipProvider delay={150}>{children}</TooltipProvider>
                                </SolanaProvider>
                            </ProposalsProvider>
                        </GlobalConfigProvider>
                    </NcnApiProvider>
                </RpcProvider>
            </StakeWizProvider>
        </PersistQueryClientProvider>
    );
}
