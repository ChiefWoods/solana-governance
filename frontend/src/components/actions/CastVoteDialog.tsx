'use client';

import { useConnector } from '@solana/connector/react';
import { address } from '@solana/kit';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { Vote } from 'lucide-react';
import { useEffect } from 'react';
import { z } from 'zod';

import { ActionDialog } from '@/components/actions/ActionDialog';
import { ProposalAddressField } from '@/components/actions/ProposalAddressField';
import { VoteDistributionControls } from '@/components/actions/VoteDistributionControls';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNcnApi } from '@/contexts/NcnApiContext';
import { useRpc } from '@/contexts/RpcContext';
import { useProposalRows } from '@/hooks/useProposalRows';
import { useSignTransaction } from '@/hooks/useSignTransaction';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { useWalletStakeAccounts } from '@/hooks/useWalletStakeAccounts';
import { formatCompactSol, truncateAddress } from '@/lib/format';
import { ncnNetwork } from '@/lib/ncn';
import { QUERY_KEYS } from '@/lib/queryKeys';
import {
    buildCastVoteInstruction,
    buildCastVoteOverrideInstruction,
    buildModifyVoteInstruction,
    buildModifyVoteOverrideInstruction,
} from '@/lib/transactions';
import {
    EMPTY_VOTE_DISTRIBUTION,
    applyVoteOption,
    isValidVoteDistribution,
    quickVoteDistribution,
    voteDistributionTotal,
} from '@/lib/voteDistribution';
import type { CastVoteAction } from '@/types/actions';

export const castVoteInputSchema = z.object({
    distribution: z
        .object({
            abstain: z.number().int().min(0).max(100),
            against: z.number().int().min(0).max(100),
            for: z.number().int().min(0).max(100),
        })
        .refine(distribution => distribution.for + distribution.against + distribution.abstain === 100, {
            message: 'Vote distribution must total 100%.',
        }),
    stakeAccountAddress: z.string().min(1, 'Select a stake account.'),
});

export type CastVoteInput = z.infer<typeof castVoteInputSchema>;

export function CastVoteDialog({
    defaultStakeAccountAddress,
    mode,
    modifiableStakeAccountAddresses,
    onOpenChange,
    open,
    proposalAddress,
}: {
    defaultStakeAccountAddress?: string;
    mode: CastVoteAction;
    modifiableStakeAccountAddresses?: string[];
    onOpenChange: (open: boolean) => void;
    open: boolean;
    proposalAddress: string;
}) {
    const { account } = useConnector();
    const { network } = useRpc();
    const { ncnVerifierService } = useNcnApi();
    const { rows } = useProposalRows();
    const voteAccounts = useVoteAccounts();
    const stakeAccountsQuery = useWalletStakeAccounts(account ?? undefined);
    const { signAndSend } = useSignTransaction();
    const queryClient = useQueryClient();
    const selectedProposal = rows.find(proposal => proposal.address === proposalAddress);
    const splVoteAccount = voteAccounts.data?.find(voteAccount => voteAccount.nodePubkey === account)?.votePubkey;
    const validStakeAccounts = stakeAccountsQuery.data?.filter(stakeAccount => stakeAccount.activeStakeLamports > 0n);
    const hasNoValidStakeAccounts = !stakeAccountsQuery.isPending && (validStakeAccounts?.length ?? 0) === 0;
    const isOverride = mode === 'castOverride' || mode === 'modifyOverride';
    const isModify = mode === 'modifyOverride' || mode === 'modifyVote';
    const actionLabel = isModify
        ? isOverride
            ? 'Modify Override Vote'
            : 'Modify Vote'
        : isOverride
          ? 'Override Validator Vote'
          : 'Cast Vote';
    const form = useForm({
        defaultValues: { distribution: { ...EMPTY_VOTE_DISTRIBUTION }, stakeAccountAddress: '' },
        validators: {
            onChange: castVoteInputSchema,
            onMount: castVoteInputSchema,
            onSubmit: castVoteInputSchema,
        },
        onSubmit: ({ value }) => {
            if (!selectedProposal?.consensusResult) return;
            const consensusResult = selectedProposal.consensusResult;
            onOpenChange(false);
            void signAndSend({
                build: async ({ signer }) => {
                    if (isOverride) {
                        const stakeAccount = address(value.stakeAccountAddress);
                        const cluster = ncnNetwork(network);
                        const meta = await ncnVerifierService.getMeta(cluster);
                        const stakeProof = await ncnVerifierService.getStakeAccountProof(
                            stakeAccount,
                            cluster,
                            meta.slot,
                        );
                        return [
                            await (isModify ? buildModifyVoteOverrideInstruction : buildCastVoteOverrideInstruction)({
                                consensusResult,
                                distribution: value.distribution,
                                proposal: address(proposalAddress),
                                signer,
                                stakeAccount,
                                stakeMerkleLeaf: {
                                    activeStake: BigInt(stakeProof.stake_merkle_leaf.active_stake),
                                    stakeAccount: address(stakeProof.stake_merkle_leaf.stake_account),
                                    votingWallet: address(stakeProof.stake_merkle_leaf.voting_wallet),
                                },
                                stakeMerkleProof: stakeProof.stake_merkle_proof.map(node => address(node)),
                                voteAccount: address(stakeProof.vote_account),
                            }),
                        ];
                    }
                    if (!splVoteAccount) throw new Error('No active vote account found for this wallet');
                    const cluster = ncnNetwork(network);
                    const meta = await ncnVerifierService.getMeta(cluster);
                    const proof = await ncnVerifierService.getVoteAccountProof(splVoteAccount, cluster, meta.slot);
                    return [
                        await (isModify ? buildModifyVoteInstruction : buildCastVoteInstruction)({
                            consensusResult,
                            distribution: value.distribution,
                            proposal: address(proposalAddress),
                            signer,
                            splVoteAccount: address(splVoteAccount),
                            voteAccount: address(proof.meta_merkle_leaf.vote_account),
                        }),
                    ];
                },
                errorTitle: 'Vote failed',
                loadingTitle: 'Sign in your wallet',
                successTitle: isModify ? 'Vote modified' : 'Vote cast',
            })
                .then(() =>
                    Promise.all([
                        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_ALL_PROPOSALS] }),
                        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_PROPOSAL_VOTES] }),
                        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_EXISTING_VOTES] }),
                        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_STAKE_ACCOUNTS] }),
                    ]),
                )
                .catch(() => undefined);
        },
    });

    useEffect(() => {
        if (!open) return;
        form.reset();
    }, [form, open]);
    useEffect(() => {
        if (!open) return;
        form.setFieldValue(
            'stakeAccountAddress',
            current => current || defaultStakeAccountAddress || stakeAccountsQuery.data?.[0]?.address || '',
        );
    }, [defaultStakeAccountAddress, form, open, stakeAccountsQuery.data]);
    return (
        <ActionDialog
            description={`${actionLabel} on a proposal in the voting stage`}
            footer={
                <>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <form.Subscribe selector={state => state.canSubmit}>
                        {canSubmit => (
                            <Button type="button" disabled={!canSubmit} onClick={() => form.handleSubmit()}>
                                <Vote aria-hidden="true" />
                                {actionLabel}
                            </Button>
                        )}
                    </form.Subscribe>
                </>
            }
            open={open}
            title={actionLabel}
            onOpenChange={onOpenChange}
        >
            <div className="space-y-5">
                <ProposalAddressField value={proposalAddress} />
                <form.Field name="stakeAccountAddress">
                    {field => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined;

                        return (
                            <Field data-invalid={Boolean(error)}>
                                <FieldLabel>Select stake account</FieldLabel>
                                <FieldDescription>Provide a specific stake account address</FieldDescription>
                                <Select
                                    value={field.state.value || null}
                                    onValueChange={value => {
                                        if (typeof value === 'string') field.handleChange(value);
                                    }}
                                >
                                    <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Stake account: -" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stakeAccountsQuery.data?.map(stakeAccount => (
                                            <SelectItem
                                                key={stakeAccount.address}
                                                className="cursor-pointer"
                                                disabled={
                                                    stakeAccount.activeStakeLamports === 0n ||
                                                    (mode === 'modifyOverride' &&
                                                        !modifiableStakeAccountAddresses?.includes(
                                                            stakeAccount.address,
                                                        ))
                                                }
                                                value={stakeAccount.address}
                                            >
                                                {truncateAddress(stakeAccount.address)} —{' '}
                                                {formatCompactSol(stakeAccount.activeStakeLamports)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasNoValidStakeAccounts && (
                                    <FieldError>No valid stake accounts available to vote</FieldError>
                                )}
                                {error && <FieldError>{error}</FieldError>}
                            </Field>
                        );
                    }}
                </form.Field>
                <form.Field name="distribution">
                    {field => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined;

                        return (
                            <VoteDistributionControls
                                distribution={field.state.value}
                                error={error}
                                handleOptionChange={(option, value) =>
                                    field.handleChange(current => applyVoteOption(current, option, value))
                                }
                                handleQuickSelect={option => field.handleChange(quickVoteDistribution(option))}
                                isValidDistribution={isValidVoteDistribution(field.state.value)}
                                totalPercentage={voteDistributionTotal(field.state.value)}
                            />
                        );
                    }}
                </form.Field>
            </div>
        </ActionDialog>
    );
}
