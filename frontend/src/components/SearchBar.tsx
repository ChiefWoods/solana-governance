'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchBar({
    ariaLabel,
    className,
    onValueChange,
    placeholder,
    value,
}: {
    ariaLabel?: string;
    className?: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    value: string;
}) {
    return (
        <div className={cn('relative h-8 min-w-0 w-full sm:w-64', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={event => onValueChange(event.target.value)}
                placeholder={placeholder}
                className="h-8 w-full pl-8 placeholder:text-xs sm:placeholder:text-sm"
                aria-label={ariaLabel ?? placeholder}
            />
        </div>
    );
}
