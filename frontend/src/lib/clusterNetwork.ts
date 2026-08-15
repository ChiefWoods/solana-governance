import { createSolanaRpc } from '@solana/kit';

export type KnownClusterNetwork = 'mainnet' | 'testnet' | 'devnet';
export type ConnectorNetwork = KnownClusterNetwork | 'localnet';

/**
 * Known cluster genesis hashes for each public network.
 */
export const CLUSTER_GENESIS_HASHES: Record<KnownClusterNetwork, string> = {
    mainnet: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
    testnet: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY',
};

export function networkFromGenesisHash(genesisHash: string): KnownClusterNetwork | undefined {
    return (Object.keys(CLUSTER_GENESIS_HASHES) as KnownClusterNetwork[]).find(
        network => CLUSTER_GENESIS_HASHES[network] === genesisHash,
    );
}

async function fetchGenesisHash(endpointUrl: string): Promise<string> {
    return createSolanaRpc(endpointUrl).getGenesisHash().send();
}

/**
 * Preset endpoints already name their cluster. A custom RPC is identified via `getGenesisHash`;
 * hashes that are not mainnet, testnet, or devnet are treated as localnet.
 */
export async function resolveConnectorNetwork(
    endpointType: KnownClusterNetwork | 'custom',
    endpointUrl: string,
): Promise<ConnectorNetwork> {
    if (endpointType !== 'custom') {
        return endpointType;
    }

    return networkFromGenesisHash(await fetchGenesisHash(endpointUrl)) ?? 'localnet';
}
