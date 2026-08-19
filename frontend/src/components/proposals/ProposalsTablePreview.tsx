'use client';

// EPHEMERAL: layout preview only — do not commit.

import type { Address } from '@solana/kit';

import type { ProposalRow } from '@/hooks/useProposalRows';
import type { ProposalStatus } from '@/lib/proposals';

import { ProposalsTableView } from './ProposalsTable';
import { STATUS_LABELS } from './proposalStatus';

const PREVIEW_EPOCH = 1017n;
const GITHUB_URL = 'https://github.com/solana-foundation/solana-governance-proposals';
const QUORUM_PERCENT = 60;

const PREVIEW_STATUSES: ProposalStatus[] = ['supporting', 'discussion', 'voting', 'finalized', 'failed'];

const NEXT_STAGE: Partial<Record<ProposalStatus, ProposalRow['nextStage']>> = {
    discussion: { epoch: 1021n, status: 'voting' },
    supporting: { epoch: 1021n, status: 'discussion' },
    voting: { epoch: 1025n, status: 'finalized' },
};

const STAGE_EPOCHS: Record<ProposalStatus, { endEpoch: bigint; startEpoch: bigint }> = {
    discussion: { endEpoch: 1025n, startEpoch: 1021n },
    failed: { endEpoch: 0n, startEpoch: 0n },
    finalized: { endEpoch: 1010n, startEpoch: 990n },
    supporting: { endEpoch: 0n, startEpoch: 0n },
    voting: { endEpoch: 1021n, startEpoch: 1015n },
};

function previewAddress(index: number): Address {
    return `SgpPreview${String(index).padStart(2, '0')}11111111111111111111111111111111` as Address;
}

function previewRow(status: ProposalStatus, index: number): ProposalRow {
    const number = String(index + 1).padStart(4, '0');
    const epochs = STAGE_EPOCHS[status];

    return {
        address: previewAddress(index),
        consensusResult: status === 'voting' || status === 'finalized' ? previewAddress(index + 10) : null,
        creationTimestamp: Date.now() - (PREVIEW_STATUSES.length - index) * 24 * 60 * 60 * 1000,
        description: GITHUB_URL,
        endEpoch: epochs.endEpoch,
        finalized: status === 'finalized',
        nextStage: NEXT_STAGE[status] ?? null,
        proposalRef: { kind: 'sgp', label: `SGP-${number}`, number },
        quorumPercent: QUORUM_PERCENT,
        startEpoch: epochs.startEpoch,
        status,
        title: `SGP-${number}: ${STATUS_LABELS[status]} proposal`,
        voteProgress:
            status === 'voting'
                ? { quorumLamports: 261_294_000_000_000_000, ratio: 0.945, votedLamports: 247_000_000_000_000_000 }
                : status === 'supporting'
                  ? { quorumLamports: 65_320_000_000_000_000, ratio: 0.547, votedLamports: 35_710_000_000_000_000 }
                  : null,
        voting: status === 'voting' || status === 'finalized',
    };
}

const PREVIEW_ROWS: ProposalRow[] = PREVIEW_STATUSES.map(previewRow);

export function ProposalsTablePreview() {
    return (
        <div className="space-y-8">
            <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                    Layout preview with sample rows for every proposal stage
                </p>
            </div>
            <ProposalsTableView
                currentEpoch={PREVIEW_EPOCH}
                defaultExpanded="all"
                error={null}
                isEpochLoading={false}
                isLoading={false}
                refetch={() => undefined}
                rows={PREVIEW_ROWS}
            />
        </div>
    );
}
