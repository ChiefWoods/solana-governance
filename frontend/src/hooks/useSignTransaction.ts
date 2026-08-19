'use client';

import { captureException } from '@sentry/nextjs';
import { useKitTransactionSigner, useSolanaClient, useTransactionPreparer } from '@solana/connector/react';
import {
    appendTransactionMessageInstructions,
    createTransactionMessage,
    getSignatureFromTransaction,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    signTransactionMessageWithSigners,
    type Instruction,
    type TransactionModifyingSigner,
    type TransactionWithBlockhashLifetime,
} from '@solana/kit';
import { useCallback } from 'react';

import { toast } from '@/components/ui/toast';

export type SignTransactionMessages = {
    errorTitle?: string;
    loadingTitle: string;
    successTitle: string;
};

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function useSignTransaction() {
    const { client } = useSolanaClient();
    const { prepare, ready: prepareReady } = useTransactionPreparer();
    const { ready: signerReady, signer } = useKitTransactionSigner();

    const signAndSend = useCallback(
        async ({
            build,
            errorTitle = 'Transaction failed',
            loadingTitle,
            successTitle,
        }: SignTransactionMessages & {
            build: (input: { signer: TransactionModifyingSigner }) => Promise<readonly Instruction[]>;
        }) => {
            const send = async () => {
                if (!client || !signer) {
                    throw new Error('Wallet not connected');
                }

                const instructions = await build({ signer });
                const message = appendTransactionMessageInstructions(
                    [...instructions],
                    setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
                );
                const prepared = await prepare(message);
                const signed = await signTransactionMessageWithSigners(prepared);
                await sendAndConfirmTransactionFactory({
                    rpc: client.rpc,
                    rpcSubscriptions: client.rpcSubscriptions,
                })(signed as typeof signed & TransactionWithBlockhashLifetime, { commitment: 'confirmed' });

                return getSignatureFromTransaction(signed);
            };

            try {
                return await toast.promise(send(), {
                    error: error => ({
                        description: errorMessage(error),
                        priority: 'high',
                        title: errorTitle,
                        type: 'error',
                    }),
                    loading: { title: loadingTitle, type: 'loading' },
                    success: { title: successTitle, type: 'success' },
                });
            } catch (error) {
                captureException(error);
                throw error;
            }
        },
        [client, prepare, signer],
    );

    return {
        ready: Boolean(client && signer && signerReady && prepareReady),
        signAndSend,
        signer,
    };
}
