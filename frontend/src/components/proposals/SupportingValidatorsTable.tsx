'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { FilterSelect, type FilterSelectOption } from '@/components/FilterSelect';
import { RefreshButton } from '@/components/RefreshButton';
import { SearchBar } from '@/components/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { truncateAddress } from '@/lib/format';
import { showsVoteResults, type ProposalFailureAt, type ProposalStatus } from '@/lib/proposals';
import {
    supportingValidatorRowMatchesSearch,
    VOTE_CHOICES,
    VOTE_TEXT_CLASS,
    type SupportingValidatorRow,
    type SupportingValidatorVote,
} from '@/lib/proposalValidators';
import { cn } from '@/lib/utils';

import { SortableHeader } from './SortableHeader';

const PAGE_SIZES = [5, 10, 20, 50, 100] as const;

type SortColumn = 'percent' | 'stake';
type SortDir = 'asc' | 'desc';
type VoteFilter = 'all' | SupportingValidatorVote;

function numericCellValue(value: string): number {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

const VOTE_FILTER_OPTIONS: FilterSelectOption<VoteFilter>[] = [
    { label: 'All votes', value: 'all' },
    ...VOTE_CHOICES.map(choice => ({
        label: choice,
        textClass: VOTE_TEXT_CLASS[choice],
        value: choice,
    })),
];

export function SupportingValidatorsTable({
    failedAt,
    onRefresh,
    rows,
    status,
}: {
    failedAt?: ProposalFailureAt;
    onRefresh?: () => Promise<unknown> | void;
    rows: SupportingValidatorRow[];
    status: ProposalStatus;
}) {
    const [query, setQuery] = useState('');
    const [voteFilter, setVoteFilter] = useState<VoteFilter>('all');
    const [sort, setSort] = useState<{ column: SortColumn; dir: SortDir }>({ column: 'stake', dir: 'desc' });
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
    const showVotes = showsVoteResults(status, failedAt);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            if (voteFilter !== 'all' && row.vote !== voteFilter) return false;
            return supportingValidatorRowMatchesSearch(row, query);
        });
    }, [query, rows, voteFilter]);

    const sortedRows = useMemo(() => {
        const sign = sort.dir === 'asc' ? 1 : -1;
        return filteredRows.toSorted((left, right) => {
            const delta =
                numericCellValue(sort.column === 'stake' ? left.stake : left.percent) -
                numericCellValue(sort.column === 'stake' ? right.stake : right.percent);
            return delta === 0 ? 0 : delta > 0 ? sign : -sign;
        });
    }, [filteredRows, sort]);

    function toggleSort(column: SortColumn) {
        setSort(current =>
            current.column === column
                ? { column, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                : { column, dir: 'asc' },
        );
        setPageIndex(0);
    }

    const pageCount = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
    const safePageIndex = Math.min(pageIndex, pageCount - 1);
    const pageRows = sortedRows.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                    {showVotes ? 'Voters' : 'Supporters'}
                </h2>
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                    <SearchBar
                        ariaLabel="Search by name or address"
                        className={showVotes ? undefined : 'w-auto flex-1'}
                        onValueChange={value => {
                            setQuery(value);
                            setPageIndex(0);
                        }}
                        placeholder="Search by name or address..."
                        value={query}
                    />
                    {showVotes && (
                        <FilterSelect
                            ariaLabel="Filter by vote"
                            className="grow sm:grow-0"
                            onValueChange={value => {
                                setVoteFilter(value);
                                setPageIndex(0);
                            }}
                            options={VOTE_FILTER_OPTIONS}
                            value={voteFilter}
                        />
                    )}
                    <RefreshButton label={showVotes ? 'Refresh voters' : 'Refresh supporters'} onRefresh={onRefresh} />
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
                <Table
                    className="min-w-160 table-fixed"
                    containerClassName="max-h-[min(32rem,70vh)] overflow-auto scrollbar-thin"
                >
                    <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="min-w-37.5 bg-card px-6">
                                {showVotes ? 'Voter' : 'Supporter'}
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
                            <TableHead className="w-40 bg-card px-6 text-right">
                                <span className="flex justify-end">
                                    <SortableHeader
                                        isSorted={sort.column === 'percent' ? sort.dir : false}
                                        label="Weightage"
                                        onToggle={() => toggleSort('percent')}
                                    />
                                </span>
                            </TableHead>
                            {showVotes ? <TableHead className="w-28 bg-card px-6 text-right">Vote</TableHead> : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={showVotes ? 4 : 3}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    {showVotes ? 'No voters found.' : 'No supporters found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageRows.map(row => (
                                <TableRow key={row.address} className="hover:bg-muted/40">
                                    <TableCell className="min-w-37.5 max-w-0 overflow-hidden px-6 py-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar size="sm">
                                                {row.logo ? <AvatarImage src={row.logo} alt={row.name} /> : null}
                                                <AvatarFallback>?</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 overflow-hidden">
                                                <p className="truncate font-medium text-foreground">{row.name}</p>
                                                <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                                    {truncateAddress(row.address)}
                                                    <CopyButton label="address" value={row.address} />
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-right tabular-nums">{row.stake}</TableCell>
                                    <TableCell className="px-6 text-right tabular-nums">{row.percent}</TableCell>
                                    {showVotes && (
                                        <TableCell
                                            className={cn(
                                                'px-6 text-right font-medium',
                                                row.vote ? VOTE_TEXT_CLASS[row.vote] : 'text-muted-foreground',
                                            )}
                                        >
                                            {row.vote ?? '—'}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Rows per page
                    <Select
                        value={String(pageSize)}
                        onValueChange={value => {
                            setPageSize(Number(value) as (typeof PAGE_SIZES)[number]);
                            setPageIndex(0);
                        }}
                    >
                        <SelectTrigger size="sm" aria-label="Rows per page" className="min-w-14 cursor-pointer px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start" className="min-w-16">
                            {PAGE_SIZES.map(size => (
                                <SelectItem key={size} value={String(size)} className="cursor-pointer">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        Page {safePageIndex + 1} of {pageCount}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="cursor-pointer"
                            aria-label="Previous page"
                            disabled={safePageIndex === 0}
                            onClick={() => setPageIndex(current => Math.max(current - 1, 0))}
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="cursor-pointer"
                            aria-label="Next page"
                            disabled={safePageIndex >= pageCount - 1}
                            onClick={() => setPageIndex(current => Math.min(current + 1, pageCount - 1))}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
