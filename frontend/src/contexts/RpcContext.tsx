'use client';

import { setTag } from '@sentry/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { env } from '@/env';
import { resolveConnectorNetwork, type ConnectorNetwork } from '@/lib/clusterNetwork';
import { QUERY_KEYS } from '@/lib/queryKeys';

export const RPC_ENDPOINTS = ['mainnet', 'testnet', 'devnet', 'custom'] as const;
export type RpcEndpoint = (typeof RPC_ENDPOINTS)[number];

export const RPC_URLS: Record<Exclude<RpcEndpoint, 'custom'>, string> = {
    mainnet: env.NEXT_PUBLIC_SOLANA_RPC_MAINNET,
    testnet: env.NEXT_PUBLIC_SOLANA_RPC_TESTNET,
    devnet: env.NEXT_PUBLIC_SOLANA_RPC_DEVNET,
};

type RpcState = {
    endpointType: RpcEndpoint;
    endpointUrl: string;
};

type RpcContextValue = RpcState & {
    network: ConnectorNetwork;
    isResolvingNetwork: boolean;
    setEndpoint: (type: RpcEndpoint, url?: string) => void;
};

const DEFAULT_TYPE: RpcEndpoint = 'mainnet';
const DEFAULT_URL = RPC_URLS[DEFAULT_TYPE];
const STORAGE_KEY = 'solana-rpc-endpoint';

const RpcContext = createContext<RpcContextValue | undefined>(undefined);

function getStoredValues(): RpcState {
    if (typeof window === 'undefined') {
        return { endpointType: DEFAULT_TYPE, endpointUrl: DEFAULT_URL };
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return { endpointType: DEFAULT_TYPE, endpointUrl: DEFAULT_URL };
        }

        const { type, url } = JSON.parse(saved) as { type?: RpcEndpoint; url?: string };
        if (type === 'custom' && typeof url === 'string' && url.length > 0) {
            return { endpointType: type, endpointUrl: url };
        }
        if (type && type !== 'custom' && type in RPC_URLS) {
            return { endpointType: type, endpointUrl: RPC_URLS[type] };
        }
    } catch {
        console.error('Error: cannot parse RPC endpoint from local storage');
    }

    return { endpointType: DEFAULT_TYPE, endpointUrl: DEFAULT_URL };
}

export function RpcProvider({ children }: { children: ReactNode }) {
    const [endpoint, setEndpoint] = useState<RpcState>(getStoredValues);
    const queryClient = useQueryClient();

    const networkQuery = useQuery({
        enabled: endpoint.endpointType === 'custom' && Boolean(endpoint.endpointUrl),
        queryFn: () => resolveConnectorNetwork(endpoint.endpointType, endpoint.endpointUrl),
        queryKey: [QUERY_KEYS.GET_CLUSTER_NETWORK, endpoint.endpointType, endpoint.endpointUrl],
        staleTime: Infinity,
    });

    const network: ConnectorNetwork =
        endpoint.endpointType === 'custom' ? (networkQuery.data ?? 'localnet') : endpoint.endpointType;

    useEffect(() => {
        setTag('solana_network', network);
    }, [network]);

    const setEndpointData = (type: RpcEndpoint, customUrl?: string) => {
        const url = type === 'custom' ? (customUrl ?? '') : RPC_URLS[type];
        const next = { endpointType: type, endpointUrl: url };
        setEndpoint(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ type, url }));
        } catch {
            // localStorage can throw in private browsing or when quota is exceeded.
        }
        queryClient.removeQueries();
    };

    return (
        <RpcContext.Provider
            value={{
                endpointType: endpoint.endpointType,
                endpointUrl: endpoint.endpointUrl,
                isResolvingNetwork: networkQuery.isFetching,
                network,
                setEndpoint: setEndpointData,
            }}
        >
            {children}
        </RpcContext.Provider>
    );
}

export function useRpc() {
    const context = useContext(RpcContext);
    if (context === undefined) {
        throw new Error('useRpc must be used within an RpcProvider');
    }
    return context;
}
