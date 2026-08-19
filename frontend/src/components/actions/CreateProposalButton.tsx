'use client';

import { FilePlus } from 'lucide-react';
import { useState } from 'react';

import { CreateProposalDialog } from '@/components/actions/CreateProposalDialog';
import { WalletGatedButton } from '@/components/actions/WalletGatedButton';
import { HoverTooltip } from '@/components/proposals/HoverTooltip';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';

const VALIDATOR_TOOLTIP = 'You must be an active validator to create proposals';

export function CreateProposalButton() {
    const [open, setOpen] = useState(false);
    const { isLoading, isValidator } = useWalletGovernanceRole();
    const disabled = isLoading || !isValidator;
    const showTooltip = !isLoading && !isValidator;
    const button = (
        <WalletGatedButton type="button" disabled={disabled} onClick={() => setOpen(true)}>
            <FilePlus aria-hidden="true" />
            Create Proposal
        </WalletGatedButton>
    );

    return (
        <>
            {showTooltip ? <HoverTooltip content={VALIDATOR_TOOLTIP}>{button}</HoverTooltip> : button}
            <CreateProposalDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
