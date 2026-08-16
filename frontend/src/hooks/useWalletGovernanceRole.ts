'use client';

import { useConnector } from '@solana/connector/react';
import { useMemo } from 'react';

import { useVoteAccounts } from '@/hooks/useVoteAccounts';

export function useWalletGovernanceRole() {
    const { account, isConnected } = useConnector();
    const voteAccounts = useVoteAccounts();
    const connected = Boolean(isConnected && account);

    const { hasStake, isValidator } = useMemo(() => {
        if (!account || !voteAccounts.data) {
            return { hasStake: false, isValidator: false };
        }

        const matching = voteAccounts.data.filter(voteAccount => voteAccount.nodePubkey === account);

        return {
            hasStake: matching.some(voteAccount => BigInt(voteAccount.activatedStake) > 0n),
            isValidator: matching.length > 0,
        };
    }, [account, voteAccounts.data]);

    return {
        hasStake,
        isConnected: connected,
        isLoading: connected && voteAccounts.isPending,
        isValidator,
    };
}
