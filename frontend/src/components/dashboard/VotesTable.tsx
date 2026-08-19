'use client';

import { useConnector } from '@solana/connector/react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { TablePager, type PageSize } from '@/components/dashboard/TablePager';
import { SortableHeader } from '@/components/proposals/SortableHeader';
import { RefreshButton } from '@/components/RefreshButton';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentEpochCredits, useValidatorVotes } from '@/hooks/useVoteAccounts';
import { formatSol, truncateAddress } from '@/lib/format';

import type { VoteAccount } from '../../../types/solana';

type SortColumn = 'commission' | 'credits' | 'lastVote' | 'stake';
type SortDir = 'asc' | 'desc';

const EMPTY_ROWS: VoteAccount['current'] = [];

type VotesTableProps = {
    previewRows?: VoteAccount['current'];
};

function matchesQuery(votePubkey: string, nodePubkey: string, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return votePubkey.toLowerCase().includes(needle) || nodePubkey.toLowerCase().includes(needle);
}

export function VotesTable({ previewRows }: VotesTableProps) {
    const { account } = useConnector();
    const votesQuery = useValidatorVotes(account ?? undefined, { enabled: previewRows === undefined });
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<{ column: SortColumn; dir: SortDir }>({ column: 'stake', dir: 'desc' });
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState<PageSize>(10);
    const rows = previewRows ?? votesQuery.data ?? EMPTY_ROWS;
    const isPreview = previewRows !== undefined;

    const filteredRows = useMemo(
        () => rows.filter(row => matchesQuery(row.votePubkey, row.nodePubkey, query)),
        [query, rows],
    );

    const sortedRows = useMemo(() => {
        const sign = sort.dir === 'asc' ? 1 : -1;
        return filteredRows.toSorted((left, right) => {
            if (sort.column === 'commission') {
                const delta = left.commission - right.commission;
                return delta === 0 ? 0 : delta > 0 ? sign : -sign;
            }
            const leftValue =
                sort.column === 'lastVote'
                    ? left.lastVote
                    : sort.column === 'credits'
                      ? getCurrentEpochCredits(left.epochCredits)
                      : left.activatedStake;
            const rightValue =
                sort.column === 'lastVote'
                    ? right.lastVote
                    : sort.column === 'credits'
                      ? getCurrentEpochCredits(right.epochCredits)
                      : right.activatedStake;
            if (leftValue === rightValue) return 0;
            return leftValue > rightValue ? sign : -sign;
        });
    }, [filteredRows, sort]);

    function toggleSort(column: SortColumn) {
        setSort(current =>
            current.column === column
                ? { column, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                : { column, dir: 'desc' },
        );
        setPageIndex(0);
    }

    const pageCount = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
    const safePageIndex = Math.min(pageIndex, pageCount - 1);
    const pageRows = sortedRows.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Vote accounts</h2>
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                    <SearchBar
                        ariaLabel="Search vote accounts"
                        onValueChange={value => {
                            setQuery(value);
                            setPageIndex(0);
                        }}
                        placeholder="Search by address..."
                        value={query}
                    />
                    <RefreshButton
                        label="Refresh vote accounts"
                        onRefresh={isPreview ? undefined : votesQuery.refetch}
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
                                Vote account
                            </TableHead>
                            <TableHead className="w-44 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'stake' ? sort.dir : false}
                                        label="Delegated stake (SOL)"
                                        onToggle={() => toggleSort('stake')}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="w-36 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'commission' ? sort.dir : false}
                                        label="Commission"
                                        onToggle={() => toggleSort('commission')}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="w-40 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'lastVote' ? sort.dir : false}
                                        label="Last vote (SLOT)"
                                        onToggle={() => toggleSort('lastVote')}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="w-36 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'credits' ? sort.dir : false}
                                        label="Credits"
                                        onToggle={() => toggleSort('credits')}
                                    />
                                </span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isPreview && votesQuery.isPending ? (
                            Array.from({ length: 4 }, (_, index) => (
                                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                                    {Array.from({ length: 5 }, (_, cellIndex) => (
                                        <TableCell key={cellIndex} className="px-6 py-5">
                                            <Skeleton className="h-4 w-3/4" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : !isPreview && votesQuery.error ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-sm text-muted-foreground">Unable to load vote accounts.</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void votesQuery.refetch()}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : pageRows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                                    No vote accounts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageRows.map(row => (
                                <TableRow key={row.votePubkey} className="hover:bg-muted/40">
                                    <TableCell className="min-w-37.5 max-w-0 overflow-hidden px-6 py-4">
                                        <p className="flex items-center gap-1 font-mono text-sm text-foreground">
                                            {truncateAddress(row.votePubkey)}
                                            <CopyButton label="vote account" value={row.votePubkey} />
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-6 text-right tabular-nums">
                                        {formatSol(row.activatedStake)}
                                    </TableCell>
                                    <TableCell className="px-6 text-right tabular-nums">{`${row.commission}%`}</TableCell>
                                    <TableCell className="px-6 text-right font-mono tabular-nums">
                                        {row.lastVote.toLocaleString('en-US')}
                                    </TableCell>
                                    <TableCell className="px-6 text-right font-mono tabular-nums">
                                        <span className="flex justify-end">
                                            {getCurrentEpochCredits(row.epochCredits).toLocaleString('en-US')}
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
