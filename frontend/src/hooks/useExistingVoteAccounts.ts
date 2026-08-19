'use client';

import { address, createSolanaRpc, isAddress, type Address } from '@solana/kit';
import { fetchMaybeVote, fetchMaybeVoteOverride, findVoteOverridePda, findVotePda } from '@solana/svmgov';
import { useQuery } from '@tanstack/react-query';

import { useRpc } from '@/contexts/RpcContext';
import type { WalletStakeAccount } from '@/lib/programAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';

type ExistingVoteAccounts = {
    hasValidatorVote: boolean;
    overriddenStakeAccountAddresses: string[];
};

export async function fetchExistingVoteAccounts(
    rpcUrl: string,
    proposalAddress: string,
    validatorVoteAccount: string | undefined,
    stakeAccounts: WalletStakeAccount[],
): Promise<ExistingVoteAccounts> {
    const rpc = createSolanaRpc(rpcUrl);
    const proposal = address(proposalAddress);

    if (validatorVoteAccount) {
        const [vote] = await findVotePda({ proposal, splVoteAccount: address(validatorVoteAccount) });
        const voteAccount = await fetchMaybeVote(rpc, vote);
        return { hasValidatorVote: voteAccount.exists, overriddenStakeAccountAddresses: [] };
    }

    const delegatedStakeAccounts = stakeAccounts.filter(
        stakeAccount => stakeAccount.activeStakeLamports > 0n && stakeAccount.voter !== null,
    );
    const overriddenStakeAccountAddresses = await Promise.all(
        delegatedStakeAccounts.map(async stakeAccount => {
            const [validatorVote] = await findVotePda({ proposal, splVoteAccount: stakeAccount.voter! });
            const [voteOverride] = await findVoteOverridePda({
                proposal,
                splStakeAccount: stakeAccount.address,
                validatorVote,
            });
            const account = await fetchMaybeVoteOverride(rpc, voteOverride);
            return account.exists ? stakeAccount.address : undefined;
        }),
    );

    return {
        hasValidatorVote: false,
        overriddenStakeAccountAddresses: overriddenStakeAccountAddresses.filter(
            (stakeAccountAddress): stakeAccountAddress is Address => stakeAccountAddress !== undefined,
        ),
    };
}

export function useExistingVoteAccounts({
    proposalAddress,
    stakeAccounts,
    validatorVoteAccount,
}: {
    proposalAddress: string;
    stakeAccounts: WalletStakeAccount[] | undefined;
    validatorVoteAccount: string | undefined;
}) {
    const { endpointType, endpointUrl } = useRpc();
    const stakeAccountKey = stakeAccounts?.map(account => `${account.address}:${account.voter ?? ''}`).join(',') ?? '';

    return useQuery({
        enabled: Boolean(endpointUrl && isAddress(proposalAddress) && (validatorVoteAccount || stakeAccounts)),
        queryFn: () =>
            fetchExistingVoteAccounts(endpointUrl, proposalAddress, validatorVoteAccount, stakeAccounts ?? []),
        queryKey: [
            QUERY_KEYS.GET_EXISTING_VOTES,
            endpointType,
            endpointUrl,
            proposalAddress,
            validatorVoteAccount,
            stakeAccountKey,
        ],
        staleTime: 60_000,
    });
}
