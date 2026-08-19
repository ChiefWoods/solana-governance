'use client';

import { useConnector } from '@solana/connector/react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { TablePager, type PageSize } from '@/components/dashboard/TablePager';
import { FilterSelect, type FilterSelectOption } from '@/components/FilterSelect';
import { SortableHeader } from '@/components/proposals/SortableHeader';
import { RefreshButton } from '@/components/RefreshButton';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletStakeAccounts } from '@/hooks/useWalletStakeAccounts';
import { formatSol, truncateAddress } from '@/lib/format';
import type { WalletStakeAccount } from '@/lib/programAccounts';

type SortColumn = 'stake' | 'state';
type SortDir = 'asc' | 'desc';
type StateFilter = 'all' | WalletStakeAccount['state'];

const EMPTY_ROWS: WalletStakeAccount[] = [];

type StakeAccountsTableProps = {
    previewRows?: WalletStakeAccount[];
};

const STATE_LABELS: Record<WalletStakeAccount['state'], string> = {
    cooldown: 'Cooldown',
    deactivating: 'Deactivating',
    delegated: 'Delegated',
    inactive: 'Inactive',
    initialized: 'Initialized',
};

const STATE_TEXT_CLASS: Record<WalletStakeAccount['state'], string> = {
    cooldown: 'text-violet-600 dark:text-violet-400',
    deactivating: 'text-amber-600 dark:text-amber-400',
    delegated: 'text-emerald-600 dark:text-emerald-400',
    inactive: 'text-zinc-600 dark:text-zinc-400',
    initialized: 'text-sky-600 dark:text-sky-400',
};

const STATE_FILTER_OPTIONS: FilterSelectOption<StateFilter>[] = [
    { label: 'All states', value: 'all' },
    ...(['delegated', 'inactive', 'initialized', 'deactivating', 'cooldown'] as const).map(state => ({
        label: STATE_LABELS[state],
        textClass: STATE_TEXT_CLASS[state],
        value: state,
    })),
];

function matchesQuery(account: WalletStakeAccount, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
        account.address.toLowerCase().includes(needle) ||
        account.staker.toLowerCase().includes(needle) ||
        account.withdrawer.toLowerCase().includes(needle) ||
        (account.voter?.toLowerCase().includes(needle) ?? false)
    );
}

export function StakeAccountsTable({ previewRows }: StakeAccountsTableProps) {
    const { account } = useConnector();
    const stakeQuery = useWalletStakeAccounts(account ?? undefined);
    const [query, setQuery] = useState('');
    const [stateFilter, setStateFilter] = useState<StateFilter>('all');
    const [sort, setSort] = useState<{ column: SortColumn; dir: SortDir }>({ column: 'stake', dir: 'desc' });
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState<PageSize>(10);
    const rows = previewRows ?? stakeQuery.data ?? EMPTY_ROWS;
    const isPreview = previewRows !== undefined;

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            if (stateFilter !== 'all' && row.state !== stateFilter) return false;
            return matchesQuery(row, query);
        });
    }, [query, rows, stateFilter]);

    const sortedRows = useMemo(() => {
        const sign = sort.dir === 'asc' ? 1 : -1;
        return filteredRows.toSorted((left, right) => {
            if (sort.column === 'state') {
                const delta = left.state.localeCompare(right.state);
                return delta === 0 ? 0 : delta > 0 ? sign : -sign;
            }
            if (left.activeStakeLamports === right.activeStakeLamports) return 0;
            return left.activeStakeLamports > right.activeStakeLamports ? sign : -sign;
        });
    }, [filteredRows, sort]);

    function toggleSort(column: SortColumn) {
        setSort(current =>
            current.column === column
                ? { column, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                : { column, dir: column === 'state' ? 'asc' : 'desc' },
        );
        setPageIndex(0);
    }

    const pageCount = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
    const safePageIndex = Math.min(pageIndex, pageCount - 1);
    const pageRows = sortedRows.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Stake accounts</h2>
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                    <SearchBar
                        ariaLabel="Search stake accounts"
                        onValueChange={value => {
                            setQuery(value);
                            setPageIndex(0);
                        }}
                        placeholder="Search by address..."
                        value={query}
                    />
                    <FilterSelect
                        ariaLabel="Filter by stake state"
                        className="grow sm:grow-0"
                        onValueChange={value => {
                            setStateFilter(value);
                            setPageIndex(0);
                        }}
                        options={STATE_FILTER_OPTIONS}
                        value={stateFilter}
                    />
                    <RefreshButton
                        label="Refresh stake accounts"
                        onRefresh={isPreview ? undefined : stakeQuery.refetch}
                    />
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
                <Table
                    className="min-w-200 table-fixed"
                    containerClassName="max-h-[min(32rem,70vh)] overflow-auto scrollbar-thin"
                >
                    <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="min-w-37.5 bg-card px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Stake account
                            </TableHead>
                            <TableHead className="w-44 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'stake' ? sort.dir : false}
                                        label="Staked (SOL)"
                                        onToggle={() => toggleSort('stake')}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="min-w-37.5 bg-card px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Delegated to
                            </TableHead>
                            <TableHead className="w-36 bg-card px-6">
                                <SortableHeader
                                    isSorted={sort.column === 'state' ? sort.dir : false}
                                    label="State"
                                    onToggle={() => toggleSort('state')}
                                />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isPreview && stakeQuery.isPending ? (
                            Array.from({ length: 4 }, (_, index) => (
                                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                                    {Array.from({ length: 4 }, (_, cellIndex) => (
                                        <TableCell key={cellIndex} className="px-6 py-5">
                                            <Skeleton className="h-4 w-3/4" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : !isPreview && stakeQuery.error ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-sm text-muted-foreground">Unable to load stake accounts.</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void stakeQuery.refetch()}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : pageRows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                                    No stake accounts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageRows.map(row => (
                                <TableRow key={row.address} className="hover:bg-muted/40">
                                    <TableCell className="min-w-37.5 max-w-0 overflow-hidden px-6 py-4">
                                        <p className="flex items-center gap-1 font-mono text-sm text-foreground">
                                            {truncateAddress(row.address)}
                                            <CopyButton label="stake account" value={row.address} />
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-6 text-right tabular-nums">
                                        {formatSol(row.activeStakeLamports)}
                                    </TableCell>
                                    <TableCell className="min-w-37.5 max-w-0 overflow-hidden px-6 py-4">
                                        {row.voter ? (
                                            <p className="flex items-center gap-1 font-mono text-sm text-muted-foreground">
                                                {truncateAddress(row.voter)}
                                                <CopyButton label="vote account" value={row.voter} />
                                            </p>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <span className={`font-medium ${STATE_TEXT_CLASS[row.state]}`}>
                                            {STATE_LABELS[row.state]}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <TablePager
                pageCount={pageCount}
                pageIndex={safePageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={size => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
            />
        </section>
    );
}
