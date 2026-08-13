export const SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_STAKE = 0x1770; // 6000
export const SVMGOV_PROGRAM_ERROR__TITLE_EMPTY = 0x1771; // 6001
export const SVMGOV_PROGRAM_ERROR__TITLE_TOO_LONG = 0x1772; // 6002
export const SVMGOV_PROGRAM_ERROR__DESCRIPTION_EMPTY = 0x1773; // 6003
export const SVMGOV_PROGRAM_ERROR__DESCRIPTION_TOO_LONG = 0x1774; // 6004
export const SVMGOV_PROGRAM_ERROR__DESCRIPTION_INVALID = 0x1775; // 6005
export const SVMGOV_PROGRAM_ERROR__INVALID_PROPOSAL_ID = 0x1776; // 6006
export const SVMGOV_PROGRAM_ERROR__VOTING_NOT_STARTED = 0x1777; // 6007
export const SVMGOV_PROGRAM_ERROR__PROPOSAL_CLOSED = 0x1778; // 6008
export const SVMGOV_PROGRAM_ERROR__PROPOSAL_FINALIZED = 0x1779; // 6009
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTE_DISTRIBUTION = 0x177a; // 6010
export const SVMGOV_PROGRAM_ERROR__VOTING_PERIOD_NOT_ENDED = 0x177b; // 6011
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT = 0x177c; // 6012
export const SVMGOV_PROGRAM_ERROR__FAILED_DESERIALIZE_NODE_PUBKEY = 0x177d; // 6013
export const SVMGOV_PROGRAM_ERROR__VOTE_NODE_PUBKEY_MISMATCH = 0x177e; // 6014
export const SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_ACCOUNTS = 0x177f; // 6015
export const SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_STAKE = 0x1780; // 6016
export const SVMGOV_PROGRAM_ERROR__INVALID_START_EPOCH = 0x1781; // 6017
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTING_LENGTH = 0x1782; // 6018
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_VERSION = 0x1783; // 6019
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_SIZE = 0x1784; // 6020
export const SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT = 0x1785; // 6021
export const SVMGOV_PROGRAM_ERROR__INVALID_STAKE_STATE = 0x1786; // 6022
export const SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT_SIZE = 0x1787; // 6023
export const SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_PROGRAM = 0x1788; // 6024
export const SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_MERKLE_ROOT_UPDATE = 0x1789; // 6025
export const SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_ALREADY_SET = 0x178a; // 6026
export const SVMGOV_PROGRAM_ERROR__INVALID_MERKLE_ROOT = 0x178b; // 6027
export const SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_SLOT = 0x178c; // 6028
export const SVMGOV_PROGRAM_ERROR__MUST_BE_OWNED_BY_SNAPSHOT_PROGRAM = 0x178d; // 6029
export const SVMGOV_PROGRAM_ERROR__INVALID_CONSENSUS_RESULT_P_D_A = 0x178e; // 6030
export const SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_META_MERKLE_PROOF_P_D_A = 0x178f; // 6031
export const SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_CONSENSUS_RESULT = 0x1790; // 6032
export const SVMGOV_PROGRAM_ERROR__CANNOT_MODIFY_AFTER_START = 0x1791; // 6033
export const SVMGOV_PROGRAM_ERROR__VOTING_LENGTH_TOO_LONG = 0x1792; // 6034
export const SVMGOV_PROGRAM_ERROR__ARITHMETIC_OVERFLOW = 0x1793; // 6035
export const SVMGOV_PROGRAM_ERROR__SNAPSHOT_PROGRAM_UPGRADED = 0x1794; // 6036
export const SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_NOT_SET = 0x1795; // 6037
export const SVMGOV_PROGRAM_ERROR__SUPPORT_PERIOD_EXPIRED = 0x1796; // 6038
export const SVMGOV_PROGRAM_ERROR__NOT_IN_SUPPORT_PERIOD = 0x1797; // 6039
export const SVMGOV_PROGRAM_ERROR__CONSENSUS_RESULT_NOT_SET = 0x1798; // 6040
export const SVMGOV_PROGRAM_ERROR__UNAUTHORIZED = 0x1799; // 6041
export const SVMGOV_PROGRAM_ERROR__PROPOSAL_NOT_IN_VOTING_PHASE = 0x179a; // 6042
export const SVMGOV_PROGRAM_ERROR__INVALID_VOTE_OVERRIDE_CACHE = 0x179b; // 6043
export const SVMGOV_PROGRAM_ERROR__STAKE_ACCOUNT_OWNER_MISMATCH = 0x179c; // 6044
export const SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_ADMIN = 0x179d; // 6045
export const SVMGOV_PROGRAM_ERROR__INVALID_PROGRAM = 0x179e; // 6046
export const SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_SUPPORT_PCT_MIN = 0x179f; // 6047
export const SVMGOV_PROGRAM_ERROR__INVALID_MAX_TITLE_LENGTH = 0x17a0; // 6048
export const SVMGOV_PROGRAM_ERROR__INVALID_MAX_DESCRIPTION_LENGTH = 0x17a1; // 6049
export const SVMGOV_PROGRAM_ERROR__INVALID_ADMIN = 0x17a2; // 6050
export const SVMGOV_PROGRAM_ERROR__NO_PENDING_ADMIN = 0x17a3; // 6051
export const SVMGOV_PROGRAM_ERROR__NOT_PENDING_ADMIN = 0x17a4; // 6052
export const SVMGOV_PROGRAM_ERROR__INVALID_BALLOT_BOX = 0x17a5; // 6053
export const SVMGOV_PROGRAM_ERROR__SNAPSHOT_SLOT_NOT_IN_FUTURE = 0x17a6; // 6054
export const SVMGOV_PROGRAM_ERROR__NO_SUPPORTERS = 0x17a7; // 6055
export const SVMGOV_PROGRAM_ERROR__SUPPORTER_LIMIT_REACHED = 0x17a8; // 6056
export const SVMGOV_PROGRAM_ERROR__INVALID_MAX_SUPPORTERS = 0x17a9; // 6057
export const SVMGOV_PROGRAM_ERROR__SUPPORT_ALREADY_ACTIVATED = 0x17aa; // 6058

export type SvmgovProgramError =
    | typeof SVMGOV_PROGRAM_ERROR__ARITHMETIC_OVERFLOW
    | typeof SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_CONSENSUS_RESULT
    | typeof SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_META_MERKLE_PROOF_P_D_A
    | typeof SVMGOV_PROGRAM_ERROR__CANNOT_MODIFY_AFTER_START
    | typeof SVMGOV_PROGRAM_ERROR__CONSENSUS_RESULT_NOT_SET
    | typeof SVMGOV_PROGRAM_ERROR__DESCRIPTION_EMPTY
    | typeof SVMGOV_PROGRAM_ERROR__DESCRIPTION_INVALID
    | typeof SVMGOV_PROGRAM_ERROR__DESCRIPTION_TOO_LONG
    | typeof SVMGOV_PROGRAM_ERROR__FAILED_DESERIALIZE_NODE_PUBKEY
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_ADMIN
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_BALLOT_BOX
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_STAKE
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_SUPPORT_PCT_MIN
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_CONSENSUS_RESULT_P_D_A
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_MAX_DESCRIPTION_LENGTH
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_MAX_SUPPORTERS
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_MAX_TITLE_LENGTH
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_MERKLE_ROOT
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_PROGRAM
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_PROPOSAL_ID
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_PROGRAM
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_SLOT
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT_SIZE
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_STAKE_STATE
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_START_EPOCH
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_SIZE
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_VERSION
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTE_DISTRIBUTION
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTE_OVERRIDE_CACHE
    | typeof SVMGOV_PROGRAM_ERROR__INVALID_VOTING_LENGTH
    | typeof SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_ALREADY_SET
    | typeof SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_NOT_SET
    | typeof SVMGOV_PROGRAM_ERROR__MUST_BE_OWNED_BY_SNAPSHOT_PROGRAM
    | typeof SVMGOV_PROGRAM_ERROR__NO_PENDING_ADMIN
    | typeof SVMGOV_PROGRAM_ERROR__NO_SUPPORTERS
    | typeof SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_ACCOUNTS
    | typeof SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_STAKE
    | typeof SVMGOV_PROGRAM_ERROR__NOT_IN_SUPPORT_PERIOD
    | typeof SVMGOV_PROGRAM_ERROR__NOT_PENDING_ADMIN
    | typeof SVMGOV_PROGRAM_ERROR__PROPOSAL_CLOSED
    | typeof SVMGOV_PROGRAM_ERROR__PROPOSAL_FINALIZED
    | typeof SVMGOV_PROGRAM_ERROR__PROPOSAL_NOT_IN_VOTING_PHASE
    | typeof SVMGOV_PROGRAM_ERROR__SNAPSHOT_PROGRAM_UPGRADED
    | typeof SVMGOV_PROGRAM_ERROR__SNAPSHOT_SLOT_NOT_IN_FUTURE
    | typeof SVMGOV_PROGRAM_ERROR__STAKE_ACCOUNT_OWNER_MISMATCH
    | typeof SVMGOV_PROGRAM_ERROR__SUPPORT_ALREADY_ACTIVATED
    | typeof SVMGOV_PROGRAM_ERROR__SUPPORTER_LIMIT_REACHED
    | typeof SVMGOV_PROGRAM_ERROR__SUPPORT_PERIOD_EXPIRED
    | typeof SVMGOV_PROGRAM_ERROR__TITLE_EMPTY
    | typeof SVMGOV_PROGRAM_ERROR__TITLE_TOO_LONG
    | typeof SVMGOV_PROGRAM_ERROR__UNAUTHORIZED
    | typeof SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_ADMIN
    | typeof SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_MERKLE_ROOT_UPDATE
    | typeof SVMGOV_PROGRAM_ERROR__VOTE_NODE_PUBKEY_MISMATCH
    | typeof SVMGOV_PROGRAM_ERROR__VOTING_LENGTH_TOO_LONG
    | typeof SVMGOV_PROGRAM_ERROR__VOTING_NOT_STARTED
    | typeof SVMGOV_PROGRAM_ERROR__VOTING_PERIOD_NOT_ENDED;

export interface SvmgovProgramErrorInfo {
    code: SvmgovProgramError;
    name: string;
    message: string;
}

const SVMGOVPROGRAM_ERRORS: Readonly<Record<SvmgovProgramError, SvmgovProgramErrorInfo>> = {
    [SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_STAKE]: {
        code: 6000,
        name: 'notEnoughStake',
        message: 'Insufficient stake to perform this action',
    },
    [SVMGOV_PROGRAM_ERROR__TITLE_EMPTY]: {
        code: 6001,
        name: 'titleEmpty',
        message: 'The title of the proposal cannot be empty',
    },
    [SVMGOV_PROGRAM_ERROR__TITLE_TOO_LONG]: {
        code: 6002,
        name: 'titleTooLong',
        message: 'The title of the proposal is too long, max 200 bytes',
    },
    [SVMGOV_PROGRAM_ERROR__DESCRIPTION_EMPTY]: {
        code: 6003,
        name: 'descriptionEmpty',
        message: 'The description of the proposal cannot be empty',
    },
    [SVMGOV_PROGRAM_ERROR__DESCRIPTION_TOO_LONG]: {
        code: 6004,
        name: 'descriptionTooLong',
        message: 'The description of the proposal is too long, max 500 bytes',
    },
    [SVMGOV_PROGRAM_ERROR__DESCRIPTION_INVALID]: {
        code: 6005,
        name: 'descriptionInvalid',
        message: 'The description of the proposal must point to a github link',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_PROPOSAL_ID]: {
        code: 6006,
        name: 'invalidProposalId',
        message: 'Invalid proposal ID',
    },
    [SVMGOV_PROGRAM_ERROR__VOTING_NOT_STARTED]: {
        code: 6007,
        name: 'votingNotStarted',
        message: 'Voting on proposal not yet started',
    },
    [SVMGOV_PROGRAM_ERROR__PROPOSAL_CLOSED]: {
        code: 6008,
        name: 'proposalClosed',
        message: 'Proposal voting period has ended',
    },
    [SVMGOV_PROGRAM_ERROR__PROPOSAL_FINALIZED]: {
        code: 6009,
        name: 'proposalFinalized',
        message: 'Proposal has already been finalized',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTE_DISTRIBUTION]: {
        code: 6010,
        name: 'invalidVoteDistribution',
        message: 'Vote distribution must add up to 100% in Basis Points',
    },
    [SVMGOV_PROGRAM_ERROR__VOTING_PERIOD_NOT_ENDED]: {
        code: 6011,
        name: 'votingPeriodNotEnded',
        message: 'Voting period not yet ended',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT]: {
        code: 6012,
        name: 'invalidVoteAccount',
        message: 'Invalid vote account',
    },
    [SVMGOV_PROGRAM_ERROR__FAILED_DESERIALIZE_NODE_PUBKEY]: {
        code: 6013,
        name: 'failedDeserializeNodePubkey',
        message: 'Failed to deserialize node_pubkey from Vote account',
    },
    [SVMGOV_PROGRAM_ERROR__VOTE_NODE_PUBKEY_MISMATCH]: {
        code: 6014,
        name: 'voteNodePubkeyMismatch',
        message: 'Deserialized node_pubkey from Vote accounts does not match',
    },
    [SVMGOV_PROGRAM_ERROR__NOT_ENOUGH_ACCOUNTS]: {
        code: 6015,
        name: 'notEnoughAccounts',
        message: 'Not enough accounts for tally',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_STAKE]: {
        code: 6016,
        name: 'invalidClusterStake',
        message: 'Cluster stake cannot be zero',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_START_EPOCH]: {
        code: 6017,
        name: 'invalidStartEpoch',
        message: 'Start epoch must be current or future epoch',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTING_LENGTH]: {
        code: 6018,
        name: 'invalidVotingLength',
        message: 'Voting length must be bigger than 0',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_VERSION]: {
        code: 6019,
        name: 'invalidVoteAccountVersion',
        message: 'Invalid Vote account version',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTE_ACCOUNT_SIZE]: {
        code: 6020,
        name: 'invalidVoteAccountSize',
        message: 'Invalid Vote account size',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT]: {
        code: 6021,
        name: 'invalidStakeAccount',
        message: 'Invalid stake account',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_STAKE_STATE]: {
        code: 6022,
        name: 'invalidStakeState',
        message: 'Invalid stake account state',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_STAKE_ACCOUNT_SIZE]: {
        code: 6023,
        name: 'invalidStakeAccountSize',
        message: 'Invalid Stake account size',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_PROGRAM]: {
        code: 6024,
        name: 'invalidSnapshotProgram',
        message:
            'Invalid Snapshot program: provided program ID does not match the expected Merkle Verifier Service program',
    },
    [SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_MERKLE_ROOT_UPDATE]: {
        code: 6025,
        name: 'unauthorizedMerkleRootUpdate',
        message: 'Only the original proposal author can add the merkle root hash',
    },
    [SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_ALREADY_SET]: {
        code: 6026,
        name: 'merkleRootAlreadySet',
        message: 'Merkle root hash is already set for this proposal',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_MERKLE_ROOT]: {
        code: 6027,
        name: 'invalidMerkleRoot',
        message: 'Merkle root hash cannot be all zeros',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_SNAPSHOT_SLOT]: {
        code: 6028,
        name: 'invalidSnapshotSlot',
        message: 'Invalid snapshot slot: snapshot slot must be past or current slot',
    },
    [SVMGOV_PROGRAM_ERROR__MUST_BE_OWNED_BY_SNAPSHOT_PROGRAM]: {
        code: 6029,
        name: 'mustBeOwnedBySnapshotProgram',
        message: 'Account must be owned by Snapshot program',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_CONSENSUS_RESULT_P_D_A]: {
        code: 6030,
        name: 'invalidConsensusResultPDA',
        message: 'Invalid consensus result PDA',
    },
    [SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_META_MERKLE_PROOF_P_D_A]: {
        code: 6031,
        name: 'cannotDeserializeMetaMerkleProofPDA',
        message: 'Cannot deserialize MetaMerkleProof PDA',
    },
    [SVMGOV_PROGRAM_ERROR__CANNOT_DESERIALIZE_CONSENSUS_RESULT]: {
        code: 6032,
        name: 'cannotDeserializeConsensusResult',
        message: 'Cannot deserialize ConsensusResult',
    },
    [SVMGOV_PROGRAM_ERROR__CANNOT_MODIFY_AFTER_START]: {
        code: 6033,
        name: 'cannotModifyAfterStart',
        message: 'Cannot modify proposal after voting has started',
    },
    [SVMGOV_PROGRAM_ERROR__VOTING_LENGTH_TOO_LONG]: {
        code: 6034,
        name: 'votingLengthTooLong',
        message: 'Voting length exceeds maximum allowed epochs',
    },
    [SVMGOV_PROGRAM_ERROR__ARITHMETIC_OVERFLOW]: {
        code: 6035,
        name: 'arithmeticOverflow',
        message: 'Arithmetic overflow occurred',
    },
    [SVMGOV_PROGRAM_ERROR__SNAPSHOT_PROGRAM_UPGRADED]: {
        code: 6036,
        name: 'snapshotProgramUpgraded',
        message: 'Snapshot program has been upgraded, update protection triggered',
    },
    [SVMGOV_PROGRAM_ERROR__MERKLE_ROOT_NOT_SET]: {
        code: 6037,
        name: 'merkleRootNotSet',
        message: 'Merkle root hash has not been set for this proposal',
    },
    [SVMGOV_PROGRAM_ERROR__SUPPORT_PERIOD_EXPIRED]: {
        code: 6038,
        name: 'supportPeriodExpired',
        message: 'Support period has expired for this proposal',
    },
    [SVMGOV_PROGRAM_ERROR__NOT_IN_SUPPORT_PERIOD]: {
        code: 6039,
        name: 'notInSupportPeriod',
        message: 'Not within the support period',
    },
    [SVMGOV_PROGRAM_ERROR__CONSENSUS_RESULT_NOT_SET]: {
        code: 6040,
        name: 'consensusResultNotSet',
        message: 'Consensus result has not been set for this proposal',
    },
    [SVMGOV_PROGRAM_ERROR__UNAUTHORIZED]: {
        code: 6041,
        name: 'unauthorized',
        message: 'Unauthorized: caller is not authorized to perform this action',
    },
    [SVMGOV_PROGRAM_ERROR__PROPOSAL_NOT_IN_VOTING_PHASE]: {
        code: 6042,
        name: 'proposalNotInVotingPhase',
        message: 'Proposal is not in voting phase',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_VOTE_OVERRIDE_CACHE]: {
        code: 6043,
        name: 'invalidVoteOverrideCache',
        message: 'Invalid vote override cache',
    },
    [SVMGOV_PROGRAM_ERROR__STAKE_ACCOUNT_OWNER_MISMATCH]: {
        code: 6044,
        name: 'stakeAccountOwnerMismatch',
        message: 'Stake account owner mismatch',
    },
    [SVMGOV_PROGRAM_ERROR__UNAUTHORIZED_ADMIN]: {
        code: 6045,
        name: 'unauthorizedAdmin',
        message: 'Unauthorized: only the admin can perform this action',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_PROGRAM]: { code: 6046, name: 'invalidProgram', message: 'Invalid program' },
    [SVMGOV_PROGRAM_ERROR__INVALID_CLUSTER_SUPPORT_PCT_MIN]: {
        code: 6047,
        name: 'invalidClusterSupportPctMin',
        message: 'Invalid cluster support percentage minimum in basis points (must be between 0 and 10,000)',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_MAX_TITLE_LENGTH]: {
        code: 6048,
        name: 'invalidMaxTitleLength',
        message: 'Invalid max title length (must be greater than 0 and less than or equal to 200)',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_MAX_DESCRIPTION_LENGTH]: {
        code: 6049,
        name: 'invalidMaxDescriptionLength',
        message: 'Invalid max description length (must be greater than 0 and less than or equal to 500)',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_ADMIN]: {
        code: 6050,
        name: 'invalidAdmin',
        message: 'Admin cannot be the default (all-zero) pubkey',
    },
    [SVMGOV_PROGRAM_ERROR__NO_PENDING_ADMIN]: {
        code: 6051,
        name: 'noPendingAdmin',
        message: 'No pending admin nomination exists to accept',
    },
    [SVMGOV_PROGRAM_ERROR__NOT_PENDING_ADMIN]: {
        code: 6052,
        name: 'notPendingAdmin',
        message: 'Signer is not the pending admin nominee',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_BALLOT_BOX]: {
        code: 6053,
        name: 'invalidBallotBox',
        message: 'Invalid ballot box: provided account does not match the expected BallotBox PDA for the snapshot slot',
    },
    [SVMGOV_PROGRAM_ERROR__SNAPSHOT_SLOT_NOT_IN_FUTURE]: {
        code: 6054,
        name: 'snapshotSlotNotInFuture',
        message: 'Snapshot slot must be in the future (greater than the current slot)',
    },
    [SVMGOV_PROGRAM_ERROR__NO_SUPPORTERS]: {
        code: 6055,
        name: 'noSupporters',
        message: 'Proposal has no supporters to retally',
    },
    [SVMGOV_PROGRAM_ERROR__SUPPORTER_LIMIT_REACHED]: {
        code: 6056,
        name: 'supporterLimitReached',
        message: 'Proposal has reached the maximum number of supporters',
    },
    [SVMGOV_PROGRAM_ERROR__INVALID_MAX_SUPPORTERS]: {
        code: 6057,
        name: 'invalidMaxSupporters',
        message: 'Invalid max supporters (must be greater than 0 and less than or equal to the supporter limit)',
    },
    [SVMGOV_PROGRAM_ERROR__SUPPORT_ALREADY_ACTIVATED]: {
        code: 6058,
        name: 'supportAlreadyActivated',
        message: 'Support is closed: this proposal already reached its support threshold and voting has been scheduled',
    },
};

export function getSvmgovProgramErrorFromCode(code: number): SvmgovProgramErrorInfo | undefined {
    return SVMGOVPROGRAM_ERRORS[code as SvmgovProgramError];
}

export function getSvmgovProgramErrorMessage(code: SvmgovProgramError): string {
    return SVMGOVPROGRAM_ERRORS[code].message;
}
