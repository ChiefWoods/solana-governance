import { describe, expect, it } from 'vitest';

import { formatCompactNumber, formatCompactSol, formatPercent, percentOf, truncateAddress } from '../format';

describe('truncateAddress', () => {
    it('keeps short values intact', () => {
        expect(truncateAddress('abc')).toBe('abc');
    });

    it('truncates long addresses', () => {
        expect(truncateAddress('SgpAccountexample111111111111111111111111111')).toBe('SgpA...1111');
    });
});

describe('formatCompactNumber', () => {
    it('uses millions for large values', () => {
        expect(formatCompactNumber(67_260_000)).toBe('67.26M');
    });

    it('uses grouped digits under one million', () => {
        expect(formatCompactNumber(658_618.45)).toBe('658,618.45');
    });
});

describe('formatCompactSol', () => {
    it('appends the SOL unit by default', () => {
        expect(formatCompactSol(67_260_000_000_000_000n)).toBe('67.26M SOL');
    });

    it('can omit the unit', () => {
        expect(formatCompactSol(12_490_000_000_000_000n, { unit: false })).toBe('12.49M');
    });
});

describe('formatPercent', () => {
    it('trims trailing zeros', () => {
        expect(formatPercent(15)).toBe('15%');
        expect(formatPercent(15.45)).toBe('15.45%');
    });
});

describe('percentOf', () => {
    it('returns zero when the total is zero', () => {
        expect(percentOf(1n, 0n)).toBe(0);
    });

    it('returns two-decimal percentages', () => {
        expect(percentOf(15_450n, 100_000n)).toBe(15.45);
    });
});
