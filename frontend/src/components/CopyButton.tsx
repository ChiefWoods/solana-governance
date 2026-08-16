'use client';

import { CopyCheck, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export function CopyButton({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<number>(undefined);

    useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

    async function handleCopy() {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
            onClick={() => void handleCopy()}
        >
            {copied ? <CopyCheck className="text-green-500" /> : <Copy />}
        </Button>
    );
}
