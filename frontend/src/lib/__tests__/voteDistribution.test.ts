import { describe, expect, it } from 'vitest';

import {
    applyVoteOption,
    isValidVoteDistribution,
    parseVotePercentage,
    quickVoteDistribution,
    toVoteBasisPoints,
    voteDistributionTotal,
} from '../voteDistribution';

describe('parseVotePercentage', () => {
    it('clamps and rounds numeric values', () => {
        expect(parseVotePercentage(40.4)).toBe(40);
        expect(parseVotePercentage(150)).toBe(100);
        expect(parseVotePercentage(-4)).toBe(0);
    });

    it('parses numeric strings', () => {
        expect(parseVotePercentage('025')).toBe(25);
        expect(parseVotePercentage('')).toBe(0);
        expect(parseVotePercentage('abc')).toBe(0);
    });
});

describe('applyVoteOption', () => {
    it('reduces other options when the total would exceed 100', () => {
        expect(applyVoteOption({ abstain: 20, against: 40, for: 40 }, 'for', 80)).toEqual({
            abstain: 20,
            against: 0,
            for: 80,
        });
    });

    it('leaves room below 100 untouched', () => {
        expect(applyVoteOption({ abstain: 0, against: 0, for: 10 }, 'against', 20)).toEqual({
            abstain: 0,
            against: 20,
            for: 10,
        });
    });
});

describe('quickVoteDistribution', () => {
    it('sets a single option to 100%', () => {
        expect(quickVoteDistribution('against')).toEqual({ abstain: 0, against: 100, for: 0 });
        expect(isValidVoteDistribution(quickVoteDistribution('for'))).toBe(true);
        expect(voteDistributionTotal(quickVoteDistribution('abstain'))).toBe(100);
    });
});

describe('toVoteBasisPoints', () => {
    it('converts percentages to basis points', () => {
        expect(toVoteBasisPoints({ abstain: 10, against: 30, for: 60 })).toEqual({
            abstainVotesBp: 1000,
            againstVotesBp: 3000,
            forVotesBp: 6000,
        });
    });
});
