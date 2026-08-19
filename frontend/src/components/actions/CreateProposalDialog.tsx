'use client';

import { useConnector } from '@solana/connector/react';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { FilePlus } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { ActionDialog } from '@/components/actions/ActionDialog';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useGlobalConfig, type GlobalConfigAccount } from '@/contexts/GlobalConfigContext';
import { useSignTransaction } from '@/hooks/useSignTransaction';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { buildCreateProposalInstruction } from '@/lib/transactions';

const TITLE_PLACEHOLDER = 'SGP-0001: The Solana Constitution';
const DESCRIPTION_PLACEHOLDER = 'https://github.com/org/repo/blob/<sha>/proposals/sgp-0001-title.md';

function isOnChainValidGithubLink(link: string): boolean {
    const prefix = 'https://github.com/';
    if (!link.startsWith(prefix)) return false;

    let path = link.slice(prefix.length);
    if (path.endsWith('/')) path = path.slice(0, -1);
    if (!path || path.startsWith('/')) return false;

    const segments = path.split('/');
    return (
        segments.length >= 2 &&
        segments.length <= 10 &&
        segments.every(segment => segment.length > 0 && /^[\p{Alphabetic}\p{N}_.-]+$/u.test(segment))
    );
}

export function createProposalInputSchema(
    globalConfig: Pick<GlobalConfigAccount, 'maxDescriptionLength' | 'maxTitleLength'>,
) {
    const bytes = new TextEncoder();

    return z.object({
        description: z
            .string()
            .trim()
            .min(1, 'Description is required.')
            .refine(value => !value || bytes.encode(value).length <= globalConfig.maxDescriptionLength, {
                message: `Description must be at most ${globalConfig.maxDescriptionLength} bytes.`,
            })
            .refine(value => !value || isOnChainValidGithubLink(value), {
                message: 'Description must be a valid GitHub link.',
            }),
        title: z
            .string()
            .trim()
            .min(1, 'Title is required.')
            .refine(value => !value || bytes.encode(value).length <= globalConfig.maxTitleLength, {
                message: `Title must be at most ${globalConfig.maxTitleLength} bytes.`,
            }),
    });
}

export type CreateProposalInput = z.infer<ReturnType<typeof createProposalInputSchema>>;

export function CreateProposalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { account } = useConnector();
    const { data: globalConfig } = useGlobalConfig();
    const voteAccounts = useVoteAccounts();
    const { signAndSend } = useSignTransaction();
    const queryClient = useQueryClient();
    const splVoteAccount = voteAccounts.data?.find(voteAccount => voteAccount.nodePubkey === account)?.votePubkey;
    const proposalSchema = useMemo(
        () => (globalConfig ? createProposalInputSchema(globalConfig) : undefined),
        [globalConfig],
    );
    const form = useForm({
        defaultValues: { description: '', title: '' },
        validators: proposalSchema
            ? {
                  onChange: proposalSchema,
                  onMount: proposalSchema,
                  onSubmit: proposalSchema,
              }
            : undefined,
        onSubmit: ({ value }) => {
            if (!globalConfig || !splVoteAccount) return;
            onOpenChange(false);
            void signAndSend({
                build: async ({ signer }) => [
                    await buildCreateProposalInstruction({
                        description: value.description.trim(),
                        signer,
                        splVoteAccount,
                        title: value.title.trim(),
                    }),
                ],
                errorTitle: 'Proposal creation failed',
                loadingTitle: 'Sign in your wallet',
                successTitle: 'Proposal created',
            })
                .then(() => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_ALL_PROPOSALS] }))
                .catch(() => undefined);
        },
    });

    useEffect(() => {
        if (!open) return;
        form.reset();
    }, [form, open]);

    return (
        <ActionDialog
            description="Create a governance proposal with your validator identity"
            footer={
                <>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <form.Subscribe selector={state => state.canSubmit}>
                        {canSubmit => (
                            <Button
                                type="button"
                                disabled={!globalConfig || !splVoteAccount || !canSubmit}
                                onClick={() => form.handleSubmit()}
                            >
                                <FilePlus aria-hidden="true" />
                                Create Proposal
                            </Button>
                        )}
                    </form.Subscribe>
                </>
            }
            open={open}
            title="Create Proposal"
            onOpenChange={onOpenChange}
        >
            <div className="space-y-5">
                <form.Field name="title">
                    {field => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined;

                        return (
                            <Field data-invalid={Boolean(error)}>
                                <FieldLabel htmlFor="proposal-title">Title</FieldLabel>
                                <Input
                                    id="proposal-title"
                                    aria-invalid={Boolean(error)}
                                    placeholder={TITLE_PLACEHOLDER}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={event => field.handleChange(event.target.value)}
                                />
                                {error && <FieldError>{error}</FieldError>}
                            </Field>
                        );
                    }}
                </form.Field>
                <form.Field name="description">
                    {field => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined;

                        return (
                            <Field data-invalid={Boolean(error)}>
                                <FieldLabel htmlFor="proposal-description">Description</FieldLabel>
                                <FieldDescription>GitHub link to the SGP proposal</FieldDescription>
                                <Input
                                    id="proposal-description"
                                    aria-invalid={Boolean(error)}
                                    placeholder={DESCRIPTION_PLACEHOLDER}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={event => field.handleChange(event.target.value)}
                                />
                                {error && <FieldError>{error}</FieldError>}
                            </Field>
                        );
                    }}
                </form.Field>
            </div>
        </ActionDialog>
    );
}
