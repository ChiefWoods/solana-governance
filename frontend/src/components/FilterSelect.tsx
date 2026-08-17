'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type FilterSelectOption<T extends string = string> = {
    dotClass?: string;
    label: string;
    textClass?: string;
    value: T;
};

export function FilterSelect<T extends string>({
    ariaLabel,
    onValueChange,
    options,
    value,
}: {
    ariaLabel: string;
    onValueChange: (value: T) => void;
    options: readonly FilterSelectOption<T>[];
    value: T;
}) {
    const selected = options.find(option => option.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        aria-label={ariaLabel}
                        className="h-full min-w-36 cursor-pointer justify-between"
                    >
                        <span className={cn('flex items-center gap-2', selected?.textClass)}>
                            {selected?.dotClass ? (
                                <span className={cn('size-1.5 rounded-full', selected.dotClass)} />
                            ) : null}
                            {selected?.label}
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuRadioGroup value={value} onValueChange={next => onValueChange(next as T)}>
                    {options.map(option => (
                        <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer">
                            <span className="flex items-center gap-2">
                                {option.dotClass ? (
                                    <span className={cn('size-1.5 rounded-full', option.dotClass)} />
                                ) : null}
                                <span className={option.textClass}>{option.label}</span>
                            </span>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
