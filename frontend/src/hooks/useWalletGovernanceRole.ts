'use client';

import { useConnector } from '@solana/connector/react';
import { useMemo } from 'react';

import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { useWalletStakeAccounts } from '@/hooks/useWalletStakeAccounts';

export function useWalletGovernanceRole() {
    const { account, isConnected } = useConnector();
    const voteAccounts = useVoteAccounts();
    const stakeAccounts = useWalletStakeAccounts(account ?? undefined);
    const connected = Boolean(isConnected && account);

    const { hasStake, isValidator } = useMemo(() => {
        if (!account) {
            return { hasStake: false, isValidator: false };
        }

        const matching = voteAccounts.data?.filter(voteAccount => voteAccount.nodePubkey === account) ?? [];

        return {
            hasStake: stakeAccounts.data?.some(stakeAccount => stakeAccount.activeStakeLamports > 0n) ?? false,
            isValidator: matching.length > 0,
        };
    }, [account, stakeAccounts.data, voteAccounts.data]);

    return {
        hasStake,
        isConnected: connected,
        isLoading: connected && voteAccounts.isPending,
        isStakeLoading: connected && stakeAccounts.isPending,
        isValidator,
    };
}
