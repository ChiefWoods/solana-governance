'use client';

import { captureException } from '@sentry/nextjs';
import { useEffect } from 'react';

import { StatusPage } from '@/components/StatusPage';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        captureException(error);
    }, [error]);

    return (
        <StatusPage
            code="Error"
            description="This page could not be loaded."
            detail={error.digest ? `Error ID: ${error.digest}` : undefined}
            title="Something went wrong"
        >
            <Button size="sm" type="button" onClick={() => reset()}>
                Try again
            </Button>
        </StatusPage>
    );
}
