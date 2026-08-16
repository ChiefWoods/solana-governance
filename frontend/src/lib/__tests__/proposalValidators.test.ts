import { describe, expect, it } from 'vitest';

import {
    mapSupportValidatorRows,
    mapVoteValidatorRows,
    stakeForIdentity,
    supportingValidatorRowMatchesSearch,
    voteChoice,
} from '../proposalValidators';

describe('voteChoice', () => {
    it('picks the largest lamport bucket', () => {
        expect(
            voteChoice({
                abstainVotesLamports: 1n,
                againstVotesLamports: 3n,
                forVotesLamports: 9n,
            }),
        ).toBe('For');
        expect(
            voteChoice({
                abstainVotesLamports: 1n,
                againstVotesLamports: 8n,
                forVotesLamports: 2n,
            }),
        ).toBe('Against');
        expect(
            voteChoice({
                abstainVotesLamports: 5n,
                againstVotesLamports: 1n,
                forVotesLamports: 1n,
            }),
        ).toBe('Abstain');
    });
});

describe('stakeForIdentity', () => {
    it('sums activated stake across vote accounts for the identity', () => {
        expect(
            stakeForIdentity('NodeA', [
                { activatedStake: 10n, nodePubkey: 'NodeA', votePubkey: 'Vote1' },
                { activatedStake: 5n, nodePubkey: 'NodeB', votePubkey: 'Vote2' },
                { activatedStake: 7n, nodePubkey: 'NodeA', votePubkey: 'Vote3' },
            ]),
        ).toBe(17n);
    });
});

describe('mapSupportValidatorRows', () => {
    it('joins stake, weight, and StakeWiz metadata, sorted by stake', () => {
        const rows = mapSupportValidatorRows(
            [{ validator: 'NodeBig' }, { validator: 'NodeSmall' }],
            [
                { activatedStake: 15_000_000_000_000_000n, nodePubkey: 'NodeBig', votePubkey: 'VoteBig' },
                { activatedStake: 5_000_000_000_000_000n, nodePubkey: 'NodeSmall', votePubkey: 'VoteSmall' },
            ],
            100_000_000_000_000_000n,
            [
                {
                    activated_stake: 0,
                    commission: 0,
                    epoch_credits: 0,
                    identity: 'NodeBig',
                    image: 'https://example.test/big.png',
                    last_vote: 0,
                    name: 'Big Validator',
                    vote_identity: 'VoteBig',
                },
            ],
        );

        expect(rows.map(row => row.name)).toEqual(['Big Validator', 'Unknown']);
        expect(rows[0]).toMatchObject({
            address: 'NodeBig',
            logo: 'https://example.test/big.png',
            percent: '15%',
            stake: '15,000,000',
            voteAddresses: ['VoteBig'],
        });
        expect(rows[1]?.vote).toBeUndefined();
    });
});

describe('mapVoteValidatorRows', () => {
    it('uses snapshot stake and records the vote', () => {
        const [row] = mapVoteValidatorRows(
            [
                {
                    abstainVotesLamports: 0n,
                    againstVotesLamports: 0n,
                    forVotesLamports: 12_000_000_000_000_000n,
                    stake: 12_000_000_000_000_000n,
                    validator: 'NodeV',
                },
            ],
            [{ activatedStake: 1n, nodePubkey: 'NodeV', votePubkey: 'VoteV' }],
            100_000_000_000_000_000n,
        );

        expect(row).toMatchObject({
            address: 'NodeV',
            percent: '12%',
            stake: '12,000,000',
            vote: 'For',
            voteAddresses: ['VoteV'],
        });
    });
});

describe('supportingValidatorRowMatchesSearch', () => {
    const row = {
        address: 'SgpAccountexample111111111111111111111111111',
        name: 'Jupiter',
        percent: '2.87%',
        stake: '12,490,000',
        voteAddresses: ['JUPiTEr1aFa6mSoLEBdbxG6Kfi9W7y44o7CsrS9Vpump'],
    };

    it('matches validator names', () => {
        expect(supportingValidatorRowMatchesSearch(row, 'jupi')).toBe(true);
        expect(supportingValidatorRowMatchesSearch(row, 'marinade')).toBe(false);
    });

    it('matches identity and vote addresses, including truncated form', () => {
        expect(supportingValidatorRowMatchesSearch(row, row.address)).toBe(true);
        expect(supportingValidatorRowMatchesSearch(row, 'JUPiTEr1aFa6mSoLEBdbxG6Kfi9W7y44o7CsrS9Vpump')).toBe(true);
        expect(supportingValidatorRowMatchesSearch(row, 'SgpA...1111')).toBe(true);
    });
});
