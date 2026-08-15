import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    turbopack: {
        resolveAlias: {
            // ConnectorKit dynamically imports this optional peer; we use Kit only.
            '@solana/web3.js': './src/lib/empty-solana-web3js.ts',
        },
    },
    webpack: config => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@solana/web3.js': false,
        };
        return config;
    },
};

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
