import type { ConnectorNetwork } from './clusterNetwork';

export function ncnNetwork(network: ConnectorNetwork) {
    if (network === 'localnet') {
        throw new Error('Vote proofs are not available on localnet');
    }
    return network;
}
