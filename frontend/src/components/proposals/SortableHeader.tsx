'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export function SortableHeader({
    isSorted,
    label,
    onToggle,
}: {
    isSorted: false | 'asc' | 'desc';
    label: string;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            className="group/sort inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={onToggle}
        >
            {label}
            <span className="inline-grid size-3.5 shrink-0 place-items-center overflow-hidden">
                <ChevronDown
                    className={cn(
                        'size-3.5 origin-center transition-transform',
                        isSorted === 'asc' && 'rotate-180 text-foreground',
                        isSorted === 'desc' && 'text-foreground',
                        !isSorted && 'opacity-40 group-hover/sort:opacity-70 group-focus-visible/sort:opacity-70',
                    )}
                />
            </span>
        </button>
    );
}
