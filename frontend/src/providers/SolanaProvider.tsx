'use client';

import { AppProvider, getDefaultConfig, getDefaultMobileConfig } from '@solana/connector/react';
import { useMemo, type ReactNode } from 'react';

import { toast } from '@/components/ui/toast';
import { useRpc } from '@/contexts/RpcContext';

const APP_NAME = 'Solana Governance';

function handleConnectorError(error: Error) {
    toast.add({
        description: error.message || 'An unexpected wallet error occurred.',
        priority: 'high',
        title: 'Wallet error',
        type: 'error',
    });
}

function getOrigin() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return window.location.origin;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
    const { endpointType, endpointUrl, network } = useRpc();

    const connectorConfig = useMemo(
        () =>
            getDefaultConfig({
                appName: APP_NAME,
                appUrl: getOrigin(),
                autoConnect: true,
                clusters: [
                    {
                        id: `solana:${network}`,
                        label: network[0].toUpperCase() + network.slice(1),
                        url: endpointUrl,
                    },
                ],
                debug: process.env.NODE_ENV === 'development',
                enableMobile: true,
                network,
                onError: handleConnectorError,
                persistClusterSelection: true,
                walletConnect: true,
            }),
        [endpointUrl, network],
    );

    const mobile = useMemo(
        () =>
            getDefaultMobileConfig({
                appName: APP_NAME,
                appUrl: getOrigin(),
                network: network === 'localnet' ? undefined : network,
            }),
        [network],
    );

    return (
        <AppProvider
            key={`${endpointType}:${endpointUrl}:${network}`}
            connectorConfig={connectorConfig}
            mobile={mobile}
        >
            {children}
        </AppProvider>
    );
}
