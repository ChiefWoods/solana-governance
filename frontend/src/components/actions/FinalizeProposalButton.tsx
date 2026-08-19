'use client';

import type { Address } from '@solana/kit';
import { useQueryClient } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { useState } from 'react';

import { WalletGatedButton } from '@/components/actions/WalletGatedButton';
import { HoverTooltip } from '@/components/proposals/HoverTooltip';
import { useSignTransaction } from '@/hooks/useSignTransaction';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { buildFinalizeProposalInstruction } from '@/lib/transactions';

const ALREADY_FINALIZED_TOOLTIP = 'This proposal has already been finalized';

export function FinalizeProposalButton({
    className,
    disabled = false,
    finalized,
    proposalAddress,
}: {
    className?: string;
    disabled?: boolean;
    finalized: boolean;
    proposalAddress: Address;
}) {
    const [hasFinalized, setHasFinalized] = useState(finalized);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const { signAndSend } = useSignTransaction();
    const isFinalized = finalized || hasFinalized;

    const finalize = () => {
        setIsSubmitting(true);
        void signAndSend({
            build: async ({ signer }) => [buildFinalizeProposalInstruction({ proposal: proposalAddress, signer })],
            errorTitle: 'Proposal finalization failed',
            loadingTitle: 'Sign in your wallet',
            successTitle: 'Proposal finalized',
        })
            .then(() => {
                setHasFinalized(true);
                return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_ALL_PROPOSALS] });
            })
            .catch(() => undefined)
            .finally(() => setIsSubmitting(false));
    };

    const button = (
        <WalletGatedButton
            type="button"
            className={className}
            disabled={disabled || isFinalized || isSubmitting}
            onClick={finalize}
        >
            <Flag aria-hidden="true" />
            Finalize Proposal
        </WalletGatedButton>
    );

    return isFinalized ? <HoverTooltip content={ALREADY_FINALIZED_TOOLTIP}>{button}</HoverTooltip> : button;
}
