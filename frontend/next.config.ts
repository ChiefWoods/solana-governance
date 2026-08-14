import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {/* config options here */};

export default withSentryConfig(nextConfig, {
    org: 'solana-fndn',
    project: 'solana-governance',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    webpack: {
        treeshake: { removeDebugLogging: true },
        automaticVercelMonitors: true,
    },
});
