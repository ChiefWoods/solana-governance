'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';

export function ProgressBar({ ariaLabel, className, value }: { ariaLabel: string; className?: string; value: number }) {
    const progress = Math.min(1, Math.max(0, value / 100));
    const scaleX = useSpring(0, { damping: 30, restDelta: 0.001, stiffness: 100 });

    useEffect(() => {
        scaleX.set(progress);
    }, [progress, scaleX]);

    return (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <progress className="sr-only" aria-label={ariaLabel} max={100} value={Math.round(progress * 100)} />
            <motion.div
                aria-hidden
                className={cn('h-full w-full origin-left rounded-full will-change-transform', className)}
                style={{ scaleX }}
            />
        </div>
    );
}
