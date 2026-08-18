'use client';

import { useCallback, useEffect, useState } from 'react';

import {
    applyVoteOption,
    EMPTY_VOTE_DISTRIBUTION,
    isValidVoteDistribution,
    parseVotePercentage,
    quickVoteDistribution,
    voteDistributionTotal,
    type VoteDistribution,
    type VoteOption,
} from '@/lib/voteDistribution';

export function useVoteDistribution(initial: VoteDistribution = EMPTY_VOTE_DISTRIBUTION) {
    const [distribution, setDistribution] = useState<VoteDistribution>(initial);

    useEffect(() => {
        setDistribution(initial);
    }, [initial]);

    const handleOptionChange = useCallback((option: VoteOption, rawValue: string | number) => {
        setDistribution(previous => applyVoteOption(previous, option, parseVotePercentage(rawValue)));
    }, []);

    const handleQuickSelect = useCallback((option: VoteOption) => {
        setDistribution(quickVoteDistribution(option));
    }, []);

    const resetDistribution = useCallback((next?: VoteDistribution) => {
        setDistribution(next ?? EMPTY_VOTE_DISTRIBUTION);
    }, []);

    const totalPercentage = voteDistributionTotal(distribution);

    return {
        distribution,
        handleOptionChange,
        handleQuickSelect,
        isValidDistribution: isValidVoteDistribution(distribution),
        resetDistribution,
        totalPercentage,
    };
}
