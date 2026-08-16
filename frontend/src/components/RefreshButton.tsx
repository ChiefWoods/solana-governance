'use client';

import { RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function RefreshButton({ label, onRefresh }: { label: string; onRefresh?: () => Promise<unknown> | void }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    async function handleRefresh() {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh?.();
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="cursor-pointer"
            aria-busy={isRefreshing}
            aria-label={label}
            disabled={isRefreshing}
            onClick={() => void handleRefresh()}
        >
            <motion.span
                className="inline-flex"
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { duration: 0.7, ease: 'linear', repeat: Infinity } : { duration: 0.15 }}
            >
                <RotateCcw />
            </motion.span>
        </Button>
    );
}
