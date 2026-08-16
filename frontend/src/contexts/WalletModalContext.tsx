'use client';

import { useConnector } from '@solana/connector/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { WalletModal } from '@/components/connectorkit/WalletModal';

type WalletModalContextValue = {
    openConnectModal: () => void;
};

const WalletModalContext = createContext<WalletModalContextValue | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const { clearWalletConnectUri, isConnected, walletConnectUri } = useConnector();

    useEffect(() => {
        if (isConnected) setOpen(false);
    }, [isConnected]);

    const openConnectModal = useCallback(() => setOpen(true), []);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            setOpen(nextOpen);
            if (!nextOpen) clearWalletConnectUri();
        },
        [clearWalletConnectUri],
    );

    const value = useMemo(() => ({ openConnectModal }), [openConnectModal]);

    return (
        <WalletModalContext.Provider value={value}>
            {children}
            <WalletModal
                open={open}
                onOpenChange={handleOpenChange}
                walletConnectUri={walletConnectUri}
                onClearWalletConnectUri={clearWalletConnectUri}
            />
        </WalletModalContext.Provider>
    );
}

export function useWalletModal() {
    const context = useContext(WalletModalContext);
    if (context === undefined) {
        throw new Error('useWalletModal must be used within a WalletModalProvider');
    }
    return context;
}
