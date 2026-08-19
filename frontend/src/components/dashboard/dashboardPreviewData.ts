import type { Address } from '@solana/kit';

import type { WalletStakeAccount } from '@/lib/programAccounts';

import type { VoteAccount } from '../../../types/solana';

function previewAddress(label: string): Address {
    return `Preview${label}1111111111111111111111111111111` as Address;
}

export const DASHBOARD_PREVIEW_VIEWS = [
    { id: 'validator', label: 'Validator' },
    { id: 'staker', label: 'Staker' },
] as const;

export const PREVIEW_DASHBOARD_STATS = {
    snapshotSlot: 412_875_192n,
    totalStakedLamports: 61_034_650_000_000n,
};

export const PREVIEW_VOTE_ACCOUNTS: VoteAccount['current'] = [
    {
        activatedStake: 48_214_600_000_000n,
        commission: 5,
        epochCredits: [
            [812n, 1_447_030_220n, 1_427_860_114n],
            [813n, 1_466_915_714n, 1_447_030_220n],
        ],
        epochVoteAccount: true,
        lastVote: 412_875_192n,
        nodePubkey: previewAddress('ValidatorIdentity'),
        rootSlot: 412_875_180n,
        votePubkey: previewAddress('VoteAccountOne'),
    },
    {
        activatedStake: 12_820_050_000_000n,
        commission: 8,
        epochCredits: [
            [812n, 982_515_100n, 969_480_226n],
            [813n, 995_421_309n, 982_515_100n],
        ],
        epochVoteAccount: true,
        lastVote: 412_875_184n,
        nodePubkey: previewAddress('ValidatorIdentity'),
        rootSlot: 412_875_171n,
        votePubkey: previewAddress('VoteAccountTwo'),
    },
];

export const PREVIEW_STAKE_ACCOUNTS: WalletStakeAccount[] = [
    {
        activeStakeLamports: 28_500_000_000n,
        address: previewAddress('StakeAccountOne'),
        staker: previewAddress('StakeAuthority'),
        state: 'delegated',
        voter: previewAddress('VoteAccountOne'),
        withdrawer: previewAddress('WithdrawAuthority'),
    },
    {
        activeStakeLamports: 7_250_000_000n,
        address: previewAddress('StakeAccountTwo'),
        staker: previewAddress('StakeAuthority'),
        state: 'delegated',
        voter: previewAddress('VoteAccountTwo'),
        withdrawer: previewAddress('WithdrawAuthority'),
    },
    {
        activeStakeLamports: 0n,
        address: previewAddress('StakeAccountThree'),
        staker: previewAddress('StakeAuthority'),
        state: 'initialized',
        voter: null,
        withdrawer: previewAddress('WithdrawAuthority'),
    },
];
