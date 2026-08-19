'use client';

import { useMemo } from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSnapshotMeta } from '@/hooks/useSnapshotMeta';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { formatCompactSol } from '@/lib/format';

function StatCard({ isLoading, label, value }: { isLoading: boolean; label: string; value: string }) {
    return (
        <Card size="sm">
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                    {isLoading ? (
                        <Skeleton className="h-lh w-32" aria-label={`Loading ${label.toLowerCase()}`} />
                    ) : (
                        value
                    )}
                </CardTitle>
            </CardHeader>
        </Card>
    );
}

export function DashboardStats() {
    const snapshotMeta = useSnapshotMeta();
    const voteAccounts = useVoteAccounts();
    const totalStakedLamports = useMemo(() => {
        if (!voteAccounts.data) return undefined;
        let total = 0n;
        for (const account of voteAccounts.data) {
            total += account.activatedStake;
        }
        return total;
    }, [voteAccounts.data]);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
                isLoading={snapshotMeta.isPending}
                label="Snapshot slot"
                value={snapshotMeta.data ? snapshotMeta.data.slot.toLocaleString('en-US') : '—'}
            />
            <StatCard
                isLoading={voteAccounts.isPending}
                label="Total staked SOL"
                value={totalStakedLamports === undefined ? '—' : formatCompactSol(totalStakedLamports)}
            />
        </div>
    );
}
