import { Wallet } from 'lucide-react';

import { ConnectButton } from '@/components/connectorkit/ConnectButton';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function ConnectWalletEmpty() {
    return (
        <Empty className="border">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Wallet className="size-6" />
                </EmptyMedia>
                <EmptyTitle>Wallet not connected</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
                <ConnectButton />
            </EmptyContent>
        </Empty>
    );
}
