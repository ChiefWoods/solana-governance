import { decimalFixedPointToNumber } from '@solana/kit';
import { lamports, lamportsToSol } from '@solana/rpc-types';

export function truncateAddress(address: string, sideLength = 4): string {
    if (address.length <= 11) return address;
    return `${address.slice(0, sideLength)}...${address.slice(-sideLength)}`;
}

export function formatCompactNumber(value: number): string {
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`;
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatCompactSol(value: bigint, options?: { unit?: boolean }): string {
    const compact = formatCompactNumber(decimalFixedPointToNumber(lamportsToSol(lamports(value))));
    return options?.unit === false ? compact : `${compact} SOL`;
}

export function formatSol(value: bigint): string {
    return decimalFixedPointToNumber(lamportsToSol(lamports(value))).toLocaleString('en-US', {
        maximumFractionDigits: 2,
    });
}

export function formatPercent(value: number, digits = 2): string {
    return `${value.toFixed(digits).replace(/\.?0+$/, '')}%`;
}

export function percentOf(part: bigint, total: bigint): number {
    if (total === 0n) return 0;
    return Number((part * 10_000n) / total) / 100;
}
