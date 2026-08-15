'use client';

import { AppProvider, getDefaultConfig, getDefaultMobileConfig } from '@solana/connector/react';
import { useMemo, type ReactNode } from 'react';

import { env } from '@/env';

const APP_NAME = 'Solana Governance';

function getOrigin() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return window.location.origin;
}

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
                debug: process.env.NODE_ENV === 'development',
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
        <AppProvider connectorConfig={connectorConfig} mobile={mobile}>
            {children}
        </AppProvider>
    );
}
