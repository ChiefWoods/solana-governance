'use client';

import { useConnector } from '@solana/connector/react';
import { address, createSolanaRpc } from '@solana/kit';
import { useQueryClient } from '@tanstack/react-query';
import { HandHelping } from 'lucide-react';

import { ActionDialog } from '@/components/actions/ActionDialog';
import { ProposalAddressField } from '@/components/actions/ProposalAddressField';
import { Button } from '@/components/ui/button';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import { useRpc } from '@/contexts/RpcContext';
import { useSignTransaction } from '@/hooks/useSignTransaction';
import { useVoteAccounts } from '@/hooks/useVoteAccounts';
import { truncateAddress } from '@/lib/format';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { buildSupportProposalInstruction, snapshotSlotForSupport } from '@/lib/transactions';

export function SupportProposalDialog({
    onOpenChange,
    open,
    proposalAddress,
}: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    proposalAddress: string;
}) {
    const { account } = useConnector();
    const { data: globalConfig } = useGlobalConfig();
    const { endpointUrl } = useRpc();
    const voteAccounts = useVoteAccounts();
    const { signAndSend } = useSignTransaction();
    const queryClient = useQueryClient();
    const splVoteAccount = voteAccounts.data?.find(voteAccount => voteAccount.nodePubkey === account)?.votePubkey;
    const canSubmit = Boolean(proposalAddress && account && splVoteAccount && globalConfig);
    const handleConfirm = () => {
        if (!splVoteAccount || !globalConfig) return;
        onOpenChange(false);
        void signAndSend({
            build: async ({ signer }) => {
                const rpc = createSolanaRpc(endpointUrl);
                const [epochInfo, schedule] = await Promise.all([
                    rpc.getEpochInfo().send(),
                    rpc.getEpochSchedule().send(),
                ]);
                const snapshotSlot = snapshotSlotForSupport(epochInfo, schedule, globalConfig);

                return [
                    await buildSupportProposalInstruction({
                        proposal: address(proposalAddress),
                        signer,
                        snapshotSlot,
                        splVoteAccount: address(splVoteAccount),
                    }),
                ];
            },
            errorTitle: 'Support failed',
            loadingTitle: 'Sign in your wallet',
            successTitle: 'Proposal supported',
        })
            .then(() =>
                Promise.all([
                    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_ALL_PROPOSALS] }),
                    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_PROPOSAL_SUPPORTS] }),
                ]),
            )
            .catch(() => undefined);
    };
    return (
        <ActionDialog
            description="Support an active proposal with your validator identity"
            footer={
                <>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={!canSubmit} onClick={handleConfirm}>
                        <HandHelping aria-hidden="true" />
                        Support Proposal
                    </Button>
                </>
            }
            open={open}
            title="Support Proposal"
            onOpenChange={onOpenChange}
        >
            <div className="space-y-5">
                <ProposalAddressField value={proposalAddress} />
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Supporting as:</span>
                    <span className="font-mono tabular-nums">{account ? truncateAddress(account, 6) : '—'}</span>
                </div>
            </div>
        </ActionDialog>
    );
}
