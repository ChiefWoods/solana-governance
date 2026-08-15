import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        SENTRY_AUTH_TOKEN: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
        NEXT_PUBLIC_DOCS_URL: z.string().url().default('https://docs.governance.solana.com'),
        NEXT_PUBLIC_NCN_API_URL: z.string().url().default('https://ncn-governance.solana.com'),
        NEXT_PUBLIC_SOLANA_RPC_MAINNET: z.string().url().default('https://api.mainnet-beta.solana.com'),
        NEXT_PUBLIC_SOLANA_RPC_TESTNET: z.string().url().default('https://api.testnet.solana.com'),
        NEXT_PUBLIC_SOLANA_RPC_DEVNET: z.string().url().default('https://api.devnet.solana.com'),
    },
    runtimeEnv: {
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
        NEXT_PUBLIC_NCN_API_URL: process.env.NEXT_PUBLIC_NCN_API_URL,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        NEXT_PUBLIC_SOLANA_RPC_MAINNET: process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET,
        NEXT_PUBLIC_SOLANA_RPC_TESTNET: process.env.NEXT_PUBLIC_SOLANA_RPC_TESTNET,
        NEXT_PUBLIC_SOLANA_RPC_DEVNET: process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
