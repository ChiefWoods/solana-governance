const BIGINT_KEY = '$bigint';

export function stringifyWithBigInt(value: unknown): string {
    return JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? { [BIGINT_KEY]: val.toString() } : val));
}

export function parseWithBigInt<T>(value: string): T {
    return JSON.parse(value, (_key, val) => {
        if (
            val &&
            typeof val === 'object' &&
            !Array.isArray(val) &&
            Object.keys(val).length === 1 &&
            typeof val[BIGINT_KEY] === 'string'
        ) {
            return BigInt(val[BIGINT_KEY]);
        }
        return val;
    }) as T;
}
