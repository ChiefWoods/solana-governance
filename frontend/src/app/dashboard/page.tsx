'use client';

import { useConnector } from '@solana/connector/react';

import { CreateProposalButton } from '@/components/actions/CreateProposalButton';
import { ConnectWalletEmpty } from '@/components/dashboard/ConnectWalletEmpty';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StakeAccountsTable } from '@/components/dashboard/StakeAccountsTable';
import { VotesTable } from '@/components/dashboard/VotesTable';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';

export default function Page() {
    const { isConnected } = useConnector();
    const { isValidator } = useWalletGovernanceRole();

    if (!isConnected) {
        return (
            <main className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-8">
                <ConnectWalletEmpty />
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                    <CreateProposalButton />
                </div>
                <DashboardStats />
                {isValidator ? <VotesTable /> : <StakeAccountsTable />}
            </div>
        </main>
    );
}
