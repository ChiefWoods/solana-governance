'use client';

import { useConnector } from '@solana/connector/react';
import { Vote } from 'lucide-react';
import { useState } from 'react';

import { ActionRequirementsTooltip } from '@/components/actions/ActionRequirementsTooltip';
import { CastVoteDialog } from '@/components/actions/CastVoteDialog';
import { WalletGatedButton } from '@/components/actions/WalletGatedButton';
import { useExistingVoteAccounts } from '@/hooks/useExistingVoteAccounts';
import { useProposalRows } from '@/hooks/useProposalRows';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';
import { useWalletStakeAccounts } from '@/hooks/useWalletStakeAccounts';
import type { CastVoteAction } from '@/types/actions';

const NO_STAKE_REQUIREMENT = 'You need at least 1 stake account to override';

export function CastVoteButton({
    className,
    disabled = false,
    proposalAddress,
}: {
    className?: string;
    disabled?: boolean;
    proposalAddress: string;
}) {
    const [open, setOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<CastVoteAction>('castVote');
    const { account, isConnected } = useConnector();
    const { isLoading: isRoleLoading, isValidator } = useWalletGovernanceRole();
    const { rows, isLoading: isRowsLoading } = useProposalRows();
    const voteAccounts = useVoteAccounts();
    const stakeAccountsQuery = useWalletStakeAccounts(account ?? undefined);
    const proposalRow = rows.find(row => row.address === proposalAddress);
    const splVoteAccount = voteAccounts.data?.find(voteAccount => voteAccount.nodePubkey === account)?.votePubkey;
    const existingVotes = useExistingVoteAccounts({
        proposalAddress,
        stakeAccounts: stakeAccountsQuery.data,
        validatorVoteAccount: isValidator ? splVoteAccount : undefined,
    });
    const hasStakeAccount = (stakeAccountsQuery.data?.length ?? 0) > 0;
    const hasInactiveProposal = !isRowsLoading && proposalRow?.status !== 'voting';
    const isOverride = isConnected && !isRoleLoading && !isValidator;
    const label = isOverride
        ? 'Override Validator Vote'
        : existingVotes.data?.hasValidatorVote
          ? 'Modify Vote'
          : 'Cast Vote';
    const unmetRequirements = [
        isOverride && !stakeAccountsQuery.isPending && !hasStakeAccount ? NO_STAKE_REQUIREMENT : null,
    ].filter((requirement): requirement is string => requirement !== null);
    const shouldDisable =
        disabled ||
        (isConnected &&
            (isRoleLoading ||
                isRowsLoading ||
                existingVotes.isPending ||
                hasInactiveProposal ||
                unmetRequirements.length > 0));
    const openDialog = (mode: CastVoteAction) => {
        setDialogMode(mode);
        setOpen(true);
    };
    const overrideStakeAccountAddress = existingVotes.data?.overriddenStakeAccountAddresses[0];
    return (
        <>
            <div className="w-full space-y-2">
                <ActionRequirementsTooltip requirements={unmetRequirements}>
                    <WalletGatedButton
                        type="button"
                        className={className}
                        disabled={shouldDisable}
                        onClick={() =>
                            openDialog(
                                isOverride
                                    ? 'castOverride'
                                    : existingVotes.data?.hasValidatorVote
                                      ? 'modifyVote'
                                      : 'castVote',
                            )
                        }
                    >
                        <Vote aria-hidden="true" />
                        {label}
                    </WalletGatedButton>
                </ActionRequirementsTooltip>
                {isOverride && overrideStakeAccountAddress && (
                    <WalletGatedButton
                        type="button"
                        className={className}
                        disabled={shouldDisable}
                        onClick={() => openDialog('modifyOverride')}
                    >
                        <Vote aria-hidden="true" />
                        Modify Override Vote
                    </WalletGatedButton>
                )}
            </div>
            <CastVoteDialog
                defaultStakeAccountAddress={dialogMode === 'modifyOverride' ? overrideStakeAccountAddress : undefined}
                mode={dialogMode}
                modifiableStakeAccountAddresses={existingVotes.data?.overriddenStakeAccountAddresses}
                open={open}
                proposalAddress={proposalAddress}
                onOpenChange={setOpen}
            />
        </>
    );
}
