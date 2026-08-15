import { describe, expect, it } from 'vitest';

import { parseWithBigInt, stringifyWithBigInt } from '../localStorageJson';

describe('localStorageJson', () => {
    it('round-trips nested bigint values', () => {
        const value = {
            nested: { stake: BigInt(1_000_000_000) },
            offset: BigInt(-64),
            title: 'config',
        };

        expect(parseWithBigInt(stringifyWithBigInt(value))).toEqual(value);
    });

    it('leaves ordinary objects unchanged', () => {
        const value = { count: 3, name: 'mainnet' };

        expect(parseWithBigInt(stringifyWithBigInt(value))).toEqual(value);
    });
});
