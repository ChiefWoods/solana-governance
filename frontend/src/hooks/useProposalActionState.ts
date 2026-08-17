'use client';

import { useWalletModal } from '@/contexts/WalletModalContext';
import { useWalletGovernanceRole } from '@/hooks/useWalletGovernanceRole';

export function useProposalActionState() {
    const { hasStake, isConnected, isLoading: isRoleLoading, isValidator } = useWalletGovernanceRole();
    const { openConnectModal } = useWalletModal();
    const canSupport = isValidator && hasStake;

    return {
        requireWallet: () => {
            if (!isConnected) openConnectModal();
        },
        supportDisabled: isConnected && (isRoleLoading || !canSupport),
        supportLabel:
            isConnected && !isRoleLoading && !canSupport ? 'Only validators can support proposal' : 'Support proposal',
        voteLabel: isConnected && !isRoleLoading && !isValidator ? 'Override Validator Vote' : 'Cast Vote',
    };
}
