'use client';

import type { ReactNode } from 'react';

import { HoverTooltip } from '@/components/proposals/HoverTooltip';

export function ActionRequirementsTooltip({
    children,
    requirements,
}: {
    children: ReactNode;
    requirements: readonly string[];
}) {
    if (requirements.length === 0) return children;

    return (
        <HoverTooltip
            content={
                <ul className="list-disc space-y-1 pl-4 text-left">
                    {requirements.map(requirement => (
                        <li key={requirement}>{requirement}</li>
                    ))}
                </ul>
            }
            triggerClassName="w-full"
        >
            {children}
        </HoverTooltip>
    );
}
