import type { Metadata } from 'next';

import { GoBackButton } from '@/components/GoBackButton';
import { StatusPage } from '@/components/StatusPage';

export const metadata: Metadata = {
    robots: { follow: false, index: false },
    title: 'Page not found',
};

export default function NotFound() {
    return (
        <StatusPage code="404" description="This page does not exist or is no longer available." title="Page not found">
            <GoBackButton />
        </StatusPage>
    );
}
