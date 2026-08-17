'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function GoBackButton() {
    const router = useRouter();

    return (
        <Button size="sm" type="button" onClick={() => router.back()}>
            Go back
        </Button>
    );
}
