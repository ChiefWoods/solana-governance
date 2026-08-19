'use client';

import { useConnector } from '@solana/connector/react';
import { HandHelping } from 'lucide-react';
import { useState } from 'react';

import { ActionRequirementsTooltip } from '@/components/actions/ActionRequirementsTooltip';
import { SupportProposalDialog } from '@/components/actions/SupportProposalDialog';
import { WalletGatedButton } from '@/components/actions/WalletGatedButton';
import { useSupports } from '@/contexts/SupportsContext';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';

const VALIDATOR_REQUIREMENT = 'Must be a validator with at least 1 active vote account';
const ALREADY_SUPPORTED_REQUIREMENT = 'You have already supported this proposal';

export function SupportProposalButton({ className, proposalAddress }: { className?: string; proposalAddress: string }) {
    const [open, setOpen] = useState(false);
    const { account, isConnected } = useConnector();
    const { isLoading: isRoleLoading, isValidator } = useWalletGovernanceRole();
    const supportsQuery = useSupports();
    const hasSupported = Boolean(account && supportsQuery.data?.some(support => support.validator === account));
    const unmetRequirements = [
        !isRoleLoading && isConnected && !isValidator ? VALIDATOR_REQUIREMENT : null,
        hasSupported ? ALREADY_SUPPORTED_REQUIREMENT : null,
    ].filter((requirement): requirement is string => requirement !== null);
    const disabled = isConnected && (isRoleLoading || unmetRequirements.length > 0);
    return (
        <>
            <ActionRequirementsTooltip requirements={unmetRequirements}>
                <WalletGatedButton
                    type="button"
                    className={className}
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                >
                    <HandHelping aria-hidden="true" />
                    Support proposal
                </WalletGatedButton>
            </ActionRequirementsTooltip>
            <SupportProposalDialog onOpenChange={setOpen} open={open} proposalAddress={proposalAddress} />
        </>
    );
}
