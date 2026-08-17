import type { ProposalStatus } from '@/lib/proposals';

export const PROPOSAL_STATUSES = ['supporting', 'discussion', 'voting', 'finalized', 'failed'] as const;

/** Visual lifecycle slots. Finalized and failed share the last circle. */
export const STAGE_CIRCLES = ['supporting', 'discussion', 'voting', 'outcome'] as const;

export type StageCircle = (typeof STAGE_CIRCLES)[number];

export const STATUS_LABELS: Record<ProposalStatus, string> = {
    discussion: 'Discussion',
    failed: 'Failed',
    finalized: 'Finalized',
    supporting: 'Supporting',
    voting: 'Voting',
};

export const STATUS_DESCRIPTIONS: Record<ProposalStatus, string> = {
    discussion:
        'The proposal is locked for community review. Voting begins only after this window ends and the NCN snapshot is finalized.',
    failed: 'This proposal did not receive enough support to proceed to the discussion phase. The support threshold was not met within the required timeframe.',
    finalized:
        'Voting period has ended. The proposal is finalized and ready for on-chain execution.',
    supporting: '',
    voting: "Validators vote on active governance proposals. Delegators can override their validator's vote using stake account verification.",
};

export const FAILED_SUPPORT_DESCRIPTION =
    'This proposal did not receive enough support to proceed to the next phase. Discussion and voting begin only when enough active stake signals support within the support window.';

export const FAILED_VOTING_DESCRIPTION =
    'This proposal did not reach the approval threshold by the end of the voting period. For must be at least two-thirds (66.67%) of For + Against stake. Abstain is excluded from the denominator.';

export const STATUS_TEXT_CLASS: Record<ProposalStatus, string> = {
    discussion: 'text-dao-status-discussion',
    failed: 'text-dao-status-failed',
    finalized: 'text-dao-status-finalized',
    supporting: 'text-dao-status-supporting',
    voting: 'text-dao-status-voting',
};

export const STATUS_BADGE_CLASS: Record<ProposalStatus, string> = {
    discussion: 'bg-dao-status-discussion/15 text-dao-status-discussion',
    failed: 'bg-dao-status-failed/15 text-dao-status-failed',
    finalized: 'bg-dao-status-finalized/15 text-dao-status-finalized',
    supporting: 'bg-dao-status-supporting/15 text-dao-status-supporting',
    voting: 'bg-dao-status-voting/15 text-dao-status-voting',
};

export const STATUS_DOT_CLASS: Record<ProposalStatus, string> = {
    discussion: 'bg-dao-status-discussion',
    failed: 'bg-dao-status-failed',
    finalized: 'bg-dao-status-finalized',
    supporting: 'bg-dao-status-supporting',
    voting: 'bg-dao-status-voting',
};
