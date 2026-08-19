'use client';

import { createSolanaRpc } from '@solana/kit';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useRpc } from '@/contexts/RpcContext';
import { QUERY_KEYS } from '@/lib/queryKeys';

import { VoteAccount } from '../../types/solana';

const VOTE_ACCOUNTS_STALE_MS = 5 * 60 * 1000;

export function getCurrentEpochCredits(epochCredits: readonly (readonly [bigint, bigint, bigint])[]): bigint {
    return epochCredits.at(-1)?.[1] ?? 0n;
}

type ValidatorVotesQuery = Omit<UseQueryResult<VoteAccount['current']>, 'data'> & {
    data: VoteAccount['current'] | undefined;
};

export async function fetchVoteAccounts(rpcUrl: string): Promise<VoteAccount['current']> {
    const { current } = await createSolanaRpc(rpcUrl).getVoteAccounts().send();
    return current;
}

export function votesForValidator(accounts: VoteAccount['current'], validatorAddress: string): VoteAccount['current'] {
    return accounts.filter(account => account.nodePubkey === validatorAddress);
}

export async function fetchValidatorVotes(rpcUrl: string, validatorAddress: string): Promise<VoteAccount['current']> {
    return votesForValidator(await fetchVoteAccounts(rpcUrl), validatorAddress);
}

export function useVoteAccounts() {
    const { endpointType, endpointUrl } = useRpc();

    return useQuery({
        enabled: Boolean(endpointUrl),
        queryFn: () => fetchVoteAccounts(endpointUrl),
        queryKey: [QUERY_KEYS.GET_VOTE_ACCOUNTS, endpointType, endpointUrl],
        staleTime: VOTE_ACCOUNTS_STALE_MS,
    });
}

export function useValidatorVotes(validatorAddress: string | undefined): ValidatorVotesQuery {
    const query = useVoteAccounts();
    const data = useMemo(
        () => (validatorAddress && query.data ? votesForValidator(query.data, validatorAddress) : undefined),
        [query.data, validatorAddress],
    );

    return { ...query, data };
}
