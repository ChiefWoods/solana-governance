'use client';

import { captureException } from '@sentry/nextjs';
import { AppProvider, getDefaultConfig, getDefaultMobileConfig } from '@solana/connector/react';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useMemo, type ReactNode } from 'react';

import { env } from '@/env';
import { GET_GOVERNANCE_CONFIG, GET_PROPOSAL_DOCUMENT } from '@/lib/queryKeys';

const APP_NAME = 'Solana Governance';
const QUERY_CLIENT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour (aligns with useGovernanceConfig stale time)

function getOrigin() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return window.location.origin;
}

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
            if (queryKey === GET_PROPOSAL_DOCUMENT) return;

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
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
    key: 'REACT_QUERY_GOVERNANCE_CONFIG',
});

export function Providers({ children }: { children: ReactNode }) {
    const connectorConfig = useMemo(
        () =>
            getDefaultConfig({
                appName: APP_NAME,
                appUrl: getOrigin(),
                autoConnect: true,
                clusters: [
                    {
                        id: 'solana:mainnet',
                        label: 'Mainnet',
                        url: env.NEXT_PUBLIC_SOLANA_RPC_MAINNET,
                    },
                    {
                        id: 'solana:devnet',
                        label: 'Devnet',
                        url: env.NEXT_PUBLIC_SOLANA_RPC_DEVNET,
                    },
                    {
                        id: 'solana:testnet',
                        label: 'Testnet',
                        url: env.NEXT_PUBLIC_SOLANA_RPC_TESTNET,
                    },
                ],
                enableMobile: true,
                network: 'mainnet',
                persistClusterSelection: true,
                walletConnect: true,
            }),
        [],
    );

    const mobile = useMemo(
        () =>
            getDefaultMobileConfig({
                appName: APP_NAME,
                appUrl: getOrigin(),
                network: 'mainnet',
            }),
        [],
    );

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: queryClientPersister,
                maxAge: QUERY_CLIENT_MAX_AGE_MS,
                dehydrateOptions: {
                    shouldDehydrateQuery: query => query.queryKey[0] === GET_GOVERNANCE_CONFIG,
                },
            }}
        >
            <AppProvider connectorConfig={connectorConfig} mobile={mobile}>
                {children}
            </AppProvider>
        </PersistQueryClientProvider>
    );
}
