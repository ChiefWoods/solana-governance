import { describe, expect, it } from 'vitest';

import { getStakeAccountStatus, toWalletStakeAccount } from '../programAccounts';

describe('toWalletStakeAccount', () => {
    const meta = {
        authorized: {
            staker: 'Staker1111111111111111111111111111111111111',
            withdrawer: 'Withdrawer11111111111111111111111111111111',
        },
        lockup: {
            custodian: '11111111111111111111111111111111',
            epoch: 0n,
            unixTimestamp: 0n,
        },
        rentExemptReserve: 2_282_880n,
    } as const;

    it('maps a delegated stake account', () => {
        expect(
            toWalletStakeAccount({
                address: 'Stake11111111111111111111111111111111111112',
                data: {
                    state: {
                        __kind: 'Stake',
                        fields: [
                            meta,
                            {
                                creditsObserved: 1n,
                                delegation: {
                                    activationEpoch: 1n,
                                    deactivationEpoch: 18_446_744_073_709_551_615n,
                                    reserved: [],
                                    stake: 1_000_000_000n,
                                    voterPubkey: 'Vote111111111111111111111111111111111111111',
                                },
                            },
                            { bits: 0 },
                        ],
                    },
                },
                executable: false,
                lamports: 1_000_000_000n,
                programAddress: 'Stake11111111111111111111111111111111111111',
                space: 200n,
            } as never),
        ).toEqual({
            activeStakeLamports: 1_000_000_000n,
            address: 'Stake11111111111111111111111111111111111112',
            staker: 'Staker1111111111111111111111111111111111111',
            state: 'delegated',
            voter: 'Vote111111111111111111111111111111111111111',
            withdrawer: 'Withdrawer11111111111111111111111111111111',
        });
    });

    it('returns null for uninitialized accounts', () => {
        expect(
            toWalletStakeAccount({
                address: 'Stake11111111111111111111111111111111111112',
                data: { state: { __kind: 'Uninitialized' } },
                executable: false,
                lamports: 0n,
                programAddress: 'Stake11111111111111111111111111111111111111',
                space: 200n,
            } as never),
        ).toBeNull();
    });
});

describe('getStakeAccountStatus', () => {
    const permanentEpoch = 18_446_744_073_709_551_615n;

    it('classifies inactive, delegated, deactivating, and cooldown delegations', () => {
        expect(getStakeAccountStatus(0n, permanentEpoch, 10n)).toBe('inactive');
        expect(getStakeAccountStatus(1n, permanentEpoch, 10n)).toBe('delegated');
        expect(getStakeAccountStatus(1n, 11n, 10n)).toBe('deactivating');
        expect(getStakeAccountStatus(1n, 9n, 10n)).toBe('cooldown');
    });
});
