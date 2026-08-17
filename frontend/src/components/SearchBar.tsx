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
        <div className="relative h-full">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={event => onValueChange(event.target.value)}
                placeholder={placeholder}
                className={cn('h-full w-64 pl-8', className)}
                aria-label={ariaLabel ?? placeholder}
            />
        </div>
    );
}
