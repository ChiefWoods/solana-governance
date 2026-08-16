'use client';

import type { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function HoverTooltip({
    children,
    className,
    content,
}: {
    children: ReactNode;
    className?: string;
    content: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger render={<span className="inline-flex max-w-full" />}>{children}</TooltipTrigger>
            <TooltipContent className={cn('whitespace-normal', className)}>{content}</TooltipContent>
        </Tooltip>
    );
}
