'use client';

import { captureException } from '@sentry/nextjs';
import { useEffect } from 'react';

import { StatusPage } from '@/components/StatusPage';
import { Button } from '@/components/ui/button';

import './globals.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        captureException(error);
    }, [error]);

    return (
        <html className="dark h-full antialiased" lang="en">
            <body className="min-h-full">
                <StatusPage
                    code="Error"
                    description="The application could not be loaded."
                    detail={error.digest ? `Error ID: ${error.digest}` : undefined}
                    title="Something went wrong"
                >
                    <Button size="sm" type="button" onClick={() => reset()}>
                        Try again
                    </Button>
                </StatusPage>
            </body>
        </html>
    );
}
