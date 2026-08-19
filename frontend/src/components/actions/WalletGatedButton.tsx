'use client';

import { useConnector } from '@solana/connector/react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { useWalletModal } from '@/contexts/WalletModalContext';

type WalletGatedButtonProps = ComponentProps<typeof Button>;

export function WalletGatedButton({ onClick, ...props }: WalletGatedButtonProps) {
    const { isConnected } = useConnector();
    const { openConnectModal } = useWalletModal();

    return (
        <Button
            {...props}
            onClick={event => {
                if (!isConnected) {
                    openConnectModal();
                    return;
                }

                onClick?.(event);
            }}
        />
    );
}
