import { describe, expect, it } from 'vitest';

import { estimateMsUntilEpochStart, formatDuration, formatTimeRemaining } from '../epochTime';

describe('formatDuration', () => {
    it('formats days, hours, and minutes', () => {
        const ms = ((2 * 24 + 5) * 60 + 12) * 60 * 1000;
        expect(formatDuration(ms)).toBe('2d 5h 12m');
    });

    it('is null when the target has passed', () => {
        expect(formatDuration(0)).toBeNull();
        expect(formatDuration(-1_000)).toBeNull();
    });
});

describe('formatTimeRemaining', () => {
    it('formats days, hours, and minutes', () => {
        const ms = ((2 * 24 + 5) * 60 + 12) * 60 * 1000;
        expect(formatTimeRemaining(ms)).toBe('2d 5h 12m left');
    });

    it('keeps zero days when only hours remain', () => {
        const ms = (3 * 60 + 7) * 60 * 1000;
        expect(formatTimeRemaining(ms)).toBe('0d 3h 7m left');
    });

    it('returns the past label when the target has passed', () => {
        expect(formatTimeRemaining(0, 'Started')).toBe('Started');
        expect(formatTimeRemaining(-1_000)).toBe('Ended');
    });
});

describe('estimateMsUntilEpochStart', () => {
    it('counts remaining slots in the current epoch at 400ms each', () => {
        expect(
            estimateMsUntilEpochStart(101n, {
                epoch: 100n,
                slotIndex: 100n,
                slotsInEpoch: 432_000n,
            }),
        ).toBe((432_000 - 100) * 400);
    });

    it('is already started when the target is the current epoch', () => {
        expect(
            estimateMsUntilEpochStart(100n, {
                epoch: 100n,
                slotIndex: 50n,
                slotsInEpoch: 432_000n,
            }),
        ).toBeLessThan(0);
    });
});
