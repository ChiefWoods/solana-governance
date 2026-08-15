import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetGenesisHash = vi.fn();
const mockCreateSolanaRpc = vi.fn(() => ({
    getGenesisHash: () => ({ send: () => mockGetGenesisHash() }),
}));

vi.mock('@solana/kit', () => ({
    createSolanaRpc: (...args: unknown[]) => mockCreateSolanaRpc(...args),
}));

import { CLUSTER_GENESIS_HASHES, networkFromGenesisHash, resolveConnectorNetwork } from '../clusterNetwork';

describe('networkFromGenesisHash', () => {
    it('maps each known cluster genesis hash', () => {
        expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.mainnet)).toBe('mainnet');
        expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.devnet)).toBe('devnet');
        expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.testnet)).toBe('testnet');
    });

    it('returns undefined for an unrecognized hash', () => {
        expect(networkFromGenesisHash('unknown-genesis')).toBeUndefined();
    });
});

describe('resolveConnectorNetwork', () => {
    afterEach(() => {
        mockGetGenesisHash.mockReset();
        mockCreateSolanaRpc.mockClear();
    });

    it('returns a preset endpoint without calling the RPC', async () => {
        await expect(resolveConnectorNetwork('testnet', 'https://example.invalid')).resolves.toBe('testnet');
        expect(mockCreateSolanaRpc).not.toHaveBeenCalled();
    });

    it('resolves a custom RPC from its genesis hash', async () => {
        mockGetGenesisHash.mockResolvedValue(CLUSTER_GENESIS_HASHES.devnet);

        await expect(resolveConnectorNetwork('custom', 'https://my-rpc.example')).resolves.toBe('devnet');
        expect(mockCreateSolanaRpc).toHaveBeenCalledWith('https://my-rpc.example');
    });

    it('assumes localnet when a custom RPC genesis hash is unrecognized', async () => {
        mockGetGenesisHash.mockResolvedValue('localnet-genesis');

        await expect(resolveConnectorNetwork('custom', 'http://localhost:8899')).resolves.toBe('localnet');
    });
});
