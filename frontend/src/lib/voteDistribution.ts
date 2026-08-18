export const VOTE_OPTIONS = ['for', 'against', 'abstain'] as const;

export type VoteOption = (typeof VOTE_OPTIONS)[number];

export type VoteDistribution = Record<VoteOption, number>;

export const EMPTY_VOTE_DISTRIBUTION: VoteDistribution = {
    abstain: 0,
    against: 0,
    for: 0,
};

function clampPercentage(value: number) {
    return Math.min(100, Math.max(0, value));
}

export function parseVotePercentage(raw: string | number) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        return clampPercentage(Math.round(raw));
    }

    const trimmed = String(raw).trim();
    if (!trimmed) return 0;

    const parsed = Number.parseInt(trimmed.replace(/^0+/, '') || '0', 10);
    return Number.isNaN(parsed) ? 0 : clampPercentage(parsed);
}

export function applyVoteOption(previous: VoteDistribution, option: VoteOption, nextValue: number): VoteDistribution {
    const distribution: VoteDistribution = {
        ...previous,
        [option]: nextValue,
    };

    let excess = distribution.for + distribution.against + distribution.abstain - 100;
    if (excess <= 0) return distribution;

    for (const currentOption of VOTE_OPTIONS) {
        if (currentOption === option || distribution[currentOption] <= 0) continue;

        const reduction = Math.min(distribution[currentOption], excess);
        distribution[currentOption] -= reduction;
        excess -= reduction;
        if (excess <= 0) break;
    }

    return distribution;
}

export function quickVoteDistribution(option: VoteOption): VoteDistribution {
    return {
        abstain: option === 'abstain' ? 100 : 0,
        against: option === 'against' ? 100 : 0,
        for: option === 'for' ? 100 : 0,
    };
}

export function voteDistributionTotal(distribution: VoteDistribution) {
    return distribution.for + distribution.against + distribution.abstain;
}

export function isValidVoteDistribution(distribution: VoteDistribution) {
    return voteDistributionTotal(distribution) === 100;
}

export function toVoteBasisPoints(distribution: VoteDistribution) {
    return {
        abstainVotesBp: distribution.abstain * 100,
        againstVotesBp: distribution.against * 100,
        forVotesBp: distribution.for * 100,
    };
}
