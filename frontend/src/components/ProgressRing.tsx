'use client';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export function ProgressRing({
    ariaLabel,
    className,
    size,
    stroke,
    value,
}: {
    ariaLabel: string;
    className?: string;
    size: number;
    stroke: number;
    value: number;
}) {
    const radius = (size - stroke) / 2;
    const progress = Math.min(1, Math.max(0, value / 100));

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={cn(className)}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="img"
            aria-label={ariaLabel}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="opacity-20"
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                className="-rotate-90 origin-center"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
                transition={{ damping: 30, stiffness: 100, type: 'spring' }}
            />
        </svg>
    );
}
