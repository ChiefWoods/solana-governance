'use client';

import {
    createColumnHelper,
    createPaginatedRowModel,
    createSortedRowModel,
    rowExpandingFeature,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FilterSelect, type FilterSelectOption } from '@/components/FilterSelect';
import { RefreshButton } from '@/components/RefreshButton';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEpochInfo } from '@/hooks/useEpochInfo';
import { useProposalDocumentRefs } from '@/hooks/useProposalDocument';
import { useProposalRows, type ProposalRow } from '@/hooks/useProposalRows';
import { estimateMsUntilEpochStart, formatTimeRemaining } from '@/lib/epochTime';
import type { ProposalRef } from '@/lib/github';
import type { ProposalStatus } from '@/lib/proposals';
import { cn } from '@/lib/utils';

import { HoverTooltip } from './HoverTooltip';
import { ProposalExpandedRow } from './ProposalExpandedRow';
import { ProposalRefLabel } from './ProposalRefLabel';
import { PROPOSAL_STATUSES, STATUS_LABELS, STATUS_TEXT_CLASS } from './proposalStatus';
import { SortableHeader } from './SortableHeader';
import { StatusProgressRing } from './StatusProgressRing';
import { StatusStageCircles } from './StatusStageCircles';

const PAGE_SIZES = [5, 10, 20, 50] as const;
const EMPTY_ROWS: ProposalRow[] = [];

const features = tableFeatures({
    paginatedRowModel: createPaginatedRowModel(),
    rowExpandingFeature,
    rowPaginationFeature,
    rowSortingFeature,
    sortFns: { alphanumeric: sortFn_alphanumeric },
    sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, ProposalRow>();

function EpochCell({ pastLabel, value }: { pastLabel: string; value: bigint }) {
    const { data, isLoading } = useEpochInfo();

    if (isLoading && !data) {
        return <Skeleton className="mx-auto h-4 w-12" />;
    }

    const remaining = value && data ? formatTimeRemaining(estimateMsUntilEpochStart(value, data), pastLabel) : null;
    const label = <span className="font-mono text-sm text-muted-foreground">{value ? value.toString() : '—'}</span>;

    if (!remaining) return label;

    return <HoverTooltip content={remaining}>{label}</HoverTooltip>;
}

const columns = columnHelper.columns([
    columnHelper.accessor(row => row.proposalRef?.label ?? '', {
        cell: ({ row }) => (
            <ProposalRefLabel
                className="text-sm font-medium text-foreground"
                fallback={row.original.proposalRef}
                title={row.original.title}
                url={row.original.description}
            />
        ),
        header: 'Proposal',
        id: 'proposal',
    }),
    columnHelper.accessor('quorumPercent', {
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue()}</span>,
        header: 'Quorum (%)',
    }),
    columnHelper.accessor('startEpoch', {
        cell: ({ getValue }) => <EpochCell pastLabel="Started" value={getValue()} />,
        header: ({ column }) => (
            <SortableHeader
                isSorted={column.getIsSorted()}
                label="Voting Start"
                onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            />
        ),
    }),
    columnHelper.accessor('endEpoch', {
        cell: ({ getValue }) => <EpochCell pastLabel="Ended" value={getValue()} />,
        header: ({ column }) => (
            <SortableHeader
                isSorted={column.getIsSorted()}
                label="Voting End"
                onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            />
        ),
    }),
    columnHelper.accessor('status', {
        cell: ({ getValue }) => <StatusStageCircles status={getValue()} />,
        header: 'Status',
    }),
    columnHelper.display({
        cell: ({ row }) =>
            row.original.voteProgress && (
                <StatusProgressRing progress={row.original.voteProgress} status={row.original.status} />
            ),
        header: () => null,
        id: 'progress',
    }),
    columnHelper.display({
        cell: ({ row }) => (
            <ChevronDown
                aria-hidden
                className={cn('size-4 text-muted-foreground transition-transform', row.getIsExpanded() && 'rotate-180')}
            />
        ),
        header: () => null,
        id: 'toggle',
    }),
]);

type StatusFilter = 'all' | ProposalStatus;

const STATUS_FILTER_OPTIONS: FilterSelectOption<StatusFilter>[] = [
    { label: 'All stages', value: 'all' },
    ...PROPOSAL_STATUSES.map(status => ({
        label: STATUS_LABELS[status],
        textClass: STATUS_TEXT_CLASS[status],
        value: status,
    })),
];

function getIsExpanded(state: true | Record<string, boolean>, rowId: string) {
    return state !== true && Boolean(state[rowId]);
}

function proposalMatchesSearch(row: ProposalRow, query: string, resolvedRef?: ProposalRef) {
    const normalizedQuery = query.replace(/[\s_-]+/g, '');
    const values = [
        row.title,
        row.address,
        row.proposalRef?.label,
        row.proposalRef?.number,
        resolvedRef?.label,
        resolvedRef?.number,
    ];

    return values.some(value => {
        if (!value) return false;
        const lower = value.toLowerCase();
        return lower.includes(query) || lower.replace(/[\s_-]+/g, '').includes(normalizedQuery);
    });
}

type ProposalsTableViewProps = {
    currentEpoch: bigint | undefined;
    defaultExpanded?: 'all' | 'first';
    error: Error | null;
    isEpochLoading: boolean;
    isLoading: boolean;
    refetch: () => Promise<unknown> | void;
    rows: ProposalRow[];
};

export function ProposalsTable() {
    return <ProposalsTableView {...useProposalRows()} />;
}

export function ProposalsTableView({
    currentEpoch,
    defaultExpanded = 'first',
    error,
    isEpochLoading,
    isLoading,
    refetch,
    rows,
}: ProposalsTableViewProps) {
    const documentUrls = useMemo(() => rows.map(row => row.description), [rows]);
    const documentRefs = useProposalDocumentRefs(documentUrls);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const hasAppliedDefaultExpansion = useRef(false);

    const data = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rows.filter((row, index) => {
            if (statusFilter !== 'all' && row.status !== statusFilter) return false;
            return !query || proposalMatchesSearch(row, query, documentRefs[index]);
        });
    }, [documentRefs, rows, searchQuery, statusFilter]);

    const table = useTable({
        autoResetExpanded: false,
        autoResetPageIndex: true,
        columns,
        data: data.length > 0 ? data : EMPTY_ROWS,
        features,
        getRowCanExpand: () => true,
        getRowId: row => row.address,
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
    });

    const firstRowId = rows[0]?.address;
    useEffect(() => {
        if (hasAppliedDefaultExpansion.current || rows.length === 0) return;
        hasAppliedDefaultExpansion.current = true;
        if (defaultExpanded === 'all') {
            table.setExpanded(Object.fromEntries(rows.map(row => [row.address, true])));
            return;
        }
        if (firstRowId) {
            table.setExpanded({ [firstRowId]: true });
        }
    }, [defaultExpanded, firstRowId, rows, table]);

    const handleRowToggle = useCallback(
        (rowId: string) => {
            table.setExpanded(previous => (getIsExpanded(previous, rowId) ? {} : { [rowId]: true }));
        },
        [table],
    );

    const pageIndex = table.state.pagination.pageIndex;
    const pageSize = table.state.pagination.pageSize;
    const pageCount = Math.max(table.getPageCount(), 1);
    const columnCount = table.getAllColumns().length;
    const visibleRows = table.getRowModel().rows;

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Proposals</h1>
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Current Epoch:{' '}
                        {isEpochLoading ? (
                            <Skeleton className="h-4 w-12" aria-label="Loading current epoch" />
                        ) : (
                            <span className="font-mono text-foreground">
                                {currentEpoch === undefined ? '—' : currentEpoch.toString()}
                            </span>
                        )}
                    </div>
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                        <SearchBar
                            ariaLabel="Search by title, address"
                            className="w-full sm:w-56"
                            onValueChange={setSearchQuery}
                            placeholder="Search by title, address..."
                            value={searchQuery}
                        />
                        <FilterSelect
                            ariaLabel="Filter by stage"
                            className="grow sm:grow-0"
                            onValueChange={setStatusFilter}
                            options={STATUS_FILTER_OPTIONS}
                            value={statusFilter}
                        />
                        <RefreshButton label="Refresh proposals" onRefresh={refetch} />
                    </div>
                </div>
            </div>

            <div className="@container overflow-hidden rounded-2xl border border-border bg-card/40">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        className={cn(
                                            'h-12 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                                            header.column.id === 'proposal' ? 'text-left' : 'text-center',
                                            (header.column.id === 'progress' || header.column.id === 'toggle') &&
                                                'w-12',
                                        )}
                                    >
                                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }, (_, index) => (
                                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                                    {Array.from({ length: columnCount }, (_, cellIndex) => (
                                        <TableCell key={cellIndex} className="px-6 py-5">
                                            <Skeleton className="mx-auto h-4 w-3/4" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columnCount} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-sm text-muted-foreground">Unable to load proposals.</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void refetch()}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : visibleRows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={columnCount}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    No proposals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRows.map(row => (
                                <Fragment key={row.id}>
                                    <TableRow
                                        data-state={row.getIsExpanded() ? 'open' : undefined}
                                        className="cursor-pointer select-none hover:bg-muted/40"
                                        tabIndex={0}
                                        onClick={() => handleRowToggle(row.id)}
                                        onKeyDown={event => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                handleRowToggle(row.id);
                                            }
                                        }}
                                    >
                                        {row.getAllCells().map(cell => (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    'px-6 py-5',
                                                    cell.column.id === 'proposal' ? 'text-left' : 'text-center',
                                                )}
                                            >
                                                <table.FlexRender cell={cell} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    <AnimatePresence initial={false}>
                                        {row.getIsExpanded() && (
                                            <TableRow key={`expanded-${row.id}`} className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={columnCount}
                                                    className="max-w-0 whitespace-normal bg-background/40 p-0"
                                                >
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                                        className="sticky left-0 w-[100cqw] max-w-[100cqw] overflow-hidden"
                                                    >
                                                        <ProposalExpandedRow proposal={row.original} />
                                                    </motion.div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Rows per page
                    <Select value={String(pageSize)} onValueChange={value => table.setPageSize(Number(value))}>
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
                        Page {pageIndex + 1} of {pageCount}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="cursor-pointer"
                            aria-label="Previous page"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="cursor-pointer"
                            aria-label="Next page"
                            disabled={!table.getCanNextPage()}
                            onClick={() => table.nextPage()}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
