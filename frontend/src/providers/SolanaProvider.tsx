'use client';

import { AppProvider, getDefaultConfig, getDefaultMobileConfig } from '@solana/connector/react';
import { useMemo, type ReactNode } from 'react';

import { toast } from '@/components/ui/toast';
import { RPC_URLS, useRpc } from '@/contexts/RpcContext';
import { WalletModalProvider } from '@/contexts/WalletModalContext';

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
    const { network, endpointUrl } = useRpc();

    const connectorConfig = useMemo(() => {
        return getDefaultConfig({
            appName: APP_NAME,
            appUrl: getOrigin(),
            autoConnect: true,
            clusters: [
                { id: 'solana:mainnet', label: 'Mainnet', url: RPC_URLS.mainnet },
                { id: 'solana:devnet', label: 'Devnet', url: RPC_URLS.devnet },
                { id: 'solana:testnet', label: 'Testnet', url: RPC_URLS.testnet },
            ],
            customClusters: [
                {
                    id: 'solana:custom',
                    label: 'Custom',
                    url: endpointUrl,
                },
            ],
            debug: process.env.NODE_ENV === 'development',
            enableMobile: true,
            network,
            onError: handleConnectorError,
            persistClusterSelection: false,
            walletConnect: true,
        });
    }, [endpointUrl, network]);

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
        <AppProvider connectorConfig={connectorConfig} mobile={mobile}>
            <WalletModalProvider>{children}</WalletModalProvider>
        </AppProvider>
    );
}
