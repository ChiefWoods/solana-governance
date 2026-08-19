'use client';

import { FilePlus } from 'lucide-react';
import { useState } from 'react';

import { StakeAccountsTable } from '@/components/dashboard/StakeAccountsTable';
import { VotesTable } from '@/components/dashboard/VotesTable';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactSol } from '@/lib/format';
import { cn } from '@/lib/utils';

import {
    DASHBOARD_PREVIEW_VIEWS,
    PREVIEW_DASHBOARD_STATS,
    PREVIEW_STAKE_ACCOUNTS,
    PREVIEW_VOTE_ACCOUNTS,
} from './dashboardPreviewData';

function PreviewStats() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Card size="sm">
                <CardHeader>
                    <CardDescription>Snapshot slot</CardDescription>
                    <CardTitle className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                        {PREVIEW_DASHBOARD_STATS.snapshotSlot.toLocaleString('en-US')}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card size="sm">
                <CardHeader>
                    <CardDescription>Total staked SOL</CardDescription>
                    <CardTitle className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                        {formatCompactSol(PREVIEW_DASHBOARD_STATS.totalStakedLamports)}
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
}

export function DashboardTablesPreview() {
    const [view, setView] = useState<(typeof DASHBOARD_PREVIEW_VIEWS)[number]['id']>('validator');

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                    Layout preview with representative validator and stake data.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {DASHBOARD_PREVIEW_VIEWS.map(option => (
                        <Button
                            key={option.id}
                            type="button"
                            size="sm"
                            variant={view === option.id ? 'secondary' : 'ghost'}
                            aria-pressed={view === option.id}
                            onClick={() => setView(option.id)}
                        >
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    view === option.id ? 'bg-primary' : 'bg-muted-foreground/50',
                                )}
                            />
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                {view === 'validator' && (
                    <Button type="button">
                        <FilePlus aria-hidden="true" />
                        Create Proposal
                    </Button>
                )}
            </div>
            <PreviewStats />
            {view === 'validator' ? (
                <VotesTable previewRows={PREVIEW_VOTE_ACCOUNTS} />
            ) : (
                <StakeAccountsTable previewRows={PREVIEW_STAKE_ACCOUNTS} />
            )}
        </div>
    );
}
