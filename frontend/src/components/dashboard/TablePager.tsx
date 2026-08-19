'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PAGE_SIZES = [5, 10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export function TablePager({
    onPageIndexChange,
    onPageSizeChange,
    pageCount,
    pageIndex,
    pageSize,
}: {
    onPageIndexChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: PageSize) => void;
    pageCount: number;
    pageIndex: number;
    pageSize: PageSize;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Rows per page
                <Select value={String(pageSize)} onValueChange={value => onPageSizeChange(Number(value) as PageSize)}>
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
                        disabled={pageIndex === 0}
                        onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="cursor-pointer"
                        aria-label="Next page"
                        disabled={pageIndex >= pageCount - 1}
                        onClick={() => onPageIndexChange(Math.min(pageIndex + 1, pageCount - 1))}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
