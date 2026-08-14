import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        SENTRY_AUTH_TOKEN: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
        NEXT_PUBLIC_SOLANA_RPC_MAINNET: z.string().url().optional(),
        NEXT_PUBLIC_SOLANA_RPC_TESTNET: z.string().url().optional(),
        NEXT_PUBLIC_SOLANA_RPC_DEVNET: z.string().url().optional(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        NEXT_PUBLIC_SOLANA_RPC_MAINNET: process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET,
        NEXT_PUBLIC_SOLANA_RPC_TESTNET: process.env.NEXT_PUBLIC_SOLANA_RPC_TESTNET,
        NEXT_PUBLIC_SOLANA_RPC_DEVNET: process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
