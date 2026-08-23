import { afterEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_NCN_API_URL, NcnVerifierService } from '../src/index.ts';

const originalFetch = globalThis.fetch;
const originalNcnApiUrl = process.env.NCN_API_URL;

afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalNcnApiUrl === undefined) {
        delete process.env.NCN_API_URL;
    } else {
        process.env.NCN_API_URL = originalNcnApiUrl;
    }
});

describe('NcnVerifierService', () => {
    test('uses DEFAULT_NCN_API_URL by default', async () => {
        const fetch = vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        created_at: '2026-08-15T00:00:00Z',
                        merkle_root: 'root',
                        network: 'mainnet',
                        slot: 422_497_000,
                        snapshot_hash: 'hash',
                    }),
                ),
            ),
        );
        globalThis.fetch = fetch;

        await expect(new NcnVerifierService().getMeta('mainnet')).resolves.toEqual({
            created_at: '2026-08-15T00:00:00Z',
            merkle_root: 'root',
            network: 'mainnet',
            slot: 422_497_000,
            snapshot_hash: 'hash',
        });
        expect(fetch).toHaveBeenCalledWith(`${DEFAULT_NCN_API_URL}/meta?network=mainnet`, undefined);
    });

    test('retains the optional snapshot stake total from /meta', async () => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        created_at: '2026-08-15T00:00:00Z',
                        merkle_root: 'root',
                        network: 'mainnet',
                        slot: 422_497_000,
                        snapshot_hash: 'hash',
                        total_active_stake: 400_000_000_000_000_000,
                    }),
                ),
            ),
        );

        await expect(new NcnVerifierService().getMeta('mainnet')).resolves.toMatchObject({
            total_active_stake: 400_000_000_000_000_000,
        });
    });

    test('ignores NCN_API_URL', async () => {
        process.env.NCN_API_URL = 'https://verifier.example.com/';
        const fetch = vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        created_at: '2026-08-15T00:00:00Z',
                        merkle_root: 'root',
                        network: 'testnet',
                        slot: 1,
                        snapshot_hash: 'hash',
                    }),
                ),
            ),
        );
        globalThis.fetch = fetch;

        await new NcnVerifierService().getMeta('testnet');

        expect(fetch).toHaveBeenCalledWith(`${DEFAULT_NCN_API_URL}/meta?network=testnet`, undefined);
    });

    test('uses an explicitly configured base URL', async () => {
        const fetch = vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        created_at: '2026-08-15T00:00:00Z',
                        merkle_root: 'root',
                        network: 'mainnet',
                        slot: 1,
                        snapshot_hash: 'hash',
                    }),
                ),
            ),
        );
        globalThis.fetch = fetch;

        await new NcnVerifierService('https://verifier.example.com/').getMeta('mainnet');

        expect(fetch).toHaveBeenCalledWith('https://verifier.example.com/meta?network=mainnet', undefined);
    });

    test('retries a transient verifier failure', async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        created_at: '2026-08-15T00:00:00Z',
                        merkle_root: 'root',
                        network: 'mainnet',
                        slot: 422_497_000,
                        snapshot_hash: 'hash',
                    }),
                ),
            );

        await expect(
            new NcnVerifierService().getMeta('mainnet', { maxRetries: 1, retryDelayMs: () => 0 }),
        ).resolves.toMatchObject({ slot: 422_497_000 });
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    test('requests and validates a stake-account proof', async () => {
        const fetch = vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        network: 'mainnet',
                        snapshot_slot: 42,
                        stake_merkle_leaf: {
                            active_stake: 100,
                            stake_account: 'stake-account',
                            voting_wallet: 'voting-wallet',
                        },
                        stake_merkle_proof: ['b'],
                        vote_account: 'vote-account',
                    }),
                ),
            ),
        );
        globalThis.fetch = fetch;
        const service = new NcnVerifierService('https://verifier.example.com');

        await expect(service.getStakeAccountProof('stake-account', 'mainnet', 42)).resolves.toEqual({
            network: 'mainnet',
            snapshot_slot: 42,
            stake_merkle_leaf: {
                active_stake: 100,
                stake_account: 'stake-account',
                voting_wallet: 'voting-wallet',
            },
            stake_merkle_proof: ['b'],
            vote_account: 'vote-account',
        });
        expect(fetch).toHaveBeenCalledWith(
            'https://verifier.example.com/proof/stake_account/stake-account?network=mainnet&slot=42',
            undefined,
        );
    });
});
