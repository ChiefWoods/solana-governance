export const NCN_SNAPSHOT_ERROR__OPERATOR_NOT_WHITELISTED = 0x1770; // 6000
export const NCN_SNAPSHOT_ERROR__OPERATOR_HAS_VOTED = 0x1771; // 6001
export const NCN_SNAPSHOT_ERROR__OPERATOR_HAS_NOT_VOTED = 0x1772; // 6002
export const NCN_SNAPSHOT_ERROR__VOTING_EXPIRED = 0x1773; // 6003
export const NCN_SNAPSHOT_ERROR__VOTING_NOT_EXPIRED = 0x1774; // 6004
export const NCN_SNAPSHOT_ERROR__CONSENSUS_REACHED = 0x1775; // 6005
export const NCN_SNAPSHOT_ERROR__CONSENSUS_NOT_REACHED = 0x1776; // 6006
export const NCN_SNAPSHOT_ERROR__INVALID_BALLOT = 0x1777; // 6007
export const NCN_SNAPSHOT_ERROR__INVALID_MERKLE_INPUTS = 0x1778; // 6008
export const NCN_SNAPSHOT_ERROR__INVALID_MERKLE_PROOF = 0x1779; // 6009
export const NCN_SNAPSHOT_ERROR__VEC_FULL = 0x177a; // 6010
export const NCN_SNAPSHOT_ERROR__OVERLAPPING_WHITELIST_ENTRIES = 0x177b; // 6011
export const NCN_SNAPSHOT_ERROR__INVALID_BALLOT_INDEX = 0x177c; // 6012
export const NCN_SNAPSHOT_ERROR__INVALID_SNAPSHOT_SLOT = 0x177d; // 6013
export const NCN_SNAPSHOT_ERROR__BALLOT_TALLIES_NOT_MAX_LENGTH = 0x177e; // 6014
export const NCN_SNAPSHOT_ERROR__INVALID_PROPOSAL = 0x177f; // 6015
export const NCN_SNAPSHOT_ERROR__SNAPSHOT_SLOT_NOT_REACHED = 0x1780; // 6016

export type NcnSnapshotError =
    | typeof NCN_SNAPSHOT_ERROR__BALLOT_TALLIES_NOT_MAX_LENGTH
    | typeof NCN_SNAPSHOT_ERROR__CONSENSUS_NOT_REACHED
    | typeof NCN_SNAPSHOT_ERROR__CONSENSUS_REACHED
    | typeof NCN_SNAPSHOT_ERROR__INVALID_BALLOT
    | typeof NCN_SNAPSHOT_ERROR__INVALID_BALLOT_INDEX
    | typeof NCN_SNAPSHOT_ERROR__INVALID_MERKLE_INPUTS
    | typeof NCN_SNAPSHOT_ERROR__INVALID_MERKLE_PROOF
    | typeof NCN_SNAPSHOT_ERROR__INVALID_PROPOSAL
    | typeof NCN_SNAPSHOT_ERROR__INVALID_SNAPSHOT_SLOT
    | typeof NCN_SNAPSHOT_ERROR__OPERATOR_HAS_NOT_VOTED
    | typeof NCN_SNAPSHOT_ERROR__OPERATOR_HAS_VOTED
    | typeof NCN_SNAPSHOT_ERROR__OPERATOR_NOT_WHITELISTED
    | typeof NCN_SNAPSHOT_ERROR__OVERLAPPING_WHITELIST_ENTRIES
    | typeof NCN_SNAPSHOT_ERROR__SNAPSHOT_SLOT_NOT_REACHED
    | typeof NCN_SNAPSHOT_ERROR__VEC_FULL
    | typeof NCN_SNAPSHOT_ERROR__VOTING_EXPIRED
    | typeof NCN_SNAPSHOT_ERROR__VOTING_NOT_EXPIRED;

export interface NcnSnapshotErrorInfo {
    code: NcnSnapshotError;
    name: string;
    message: string;
}

const NCNSNAPSHOT_ERRORS: Readonly<Record<NcnSnapshotError, NcnSnapshotErrorInfo>> = {
    [NCN_SNAPSHOT_ERROR__OPERATOR_NOT_WHITELISTED]: {
        code: 6000,
        name: 'operatorNotWhitelisted',
        message: 'Operator not whitelisted',
    },
    [NCN_SNAPSHOT_ERROR__OPERATOR_HAS_VOTED]: { code: 6001, name: 'operatorHasVoted', message: 'Operator has voted' },
    [NCN_SNAPSHOT_ERROR__OPERATOR_HAS_NOT_VOTED]: {
        code: 6002,
        name: 'operatorHasNotVoted',
        message: 'Operator has not voted',
    },
    [NCN_SNAPSHOT_ERROR__VOTING_EXPIRED]: { code: 6003, name: 'votingExpired', message: 'Voting has expired' },
    [NCN_SNAPSHOT_ERROR__VOTING_NOT_EXPIRED]: { code: 6004, name: 'votingNotExpired', message: 'Voting not expired' },
    [NCN_SNAPSHOT_ERROR__CONSENSUS_REACHED]: { code: 6005, name: 'consensusReached', message: 'Consensus has reached' },
    [NCN_SNAPSHOT_ERROR__CONSENSUS_NOT_REACHED]: {
        code: 6006,
        name: 'consensusNotReached',
        message: 'Consensus not reached',
    },
    [NCN_SNAPSHOT_ERROR__INVALID_BALLOT]: { code: 6007, name: 'invalidBallot', message: 'Invalid ballot' },
    [NCN_SNAPSHOT_ERROR__INVALID_MERKLE_INPUTS]: {
        code: 6008,
        name: 'invalidMerkleInputs',
        message: 'Invalid merkle inputs',
    },
    [NCN_SNAPSHOT_ERROR__INVALID_MERKLE_PROOF]: {
        code: 6009,
        name: 'invalidMerkleProof',
        message: 'Invalid merkle proof',
    },
    [NCN_SNAPSHOT_ERROR__VEC_FULL]: { code: 6010, name: 'vecFull', message: 'Vector size exceeded' },
    [NCN_SNAPSHOT_ERROR__OVERLAPPING_WHITELIST_ENTRIES]: {
        code: 6011,
        name: 'overlappingWhitelistEntries',
        message: 'Overlapping operators in add and remove lists',
    },
    [NCN_SNAPSHOT_ERROR__INVALID_BALLOT_INDEX]: {
        code: 6012,
        name: 'invalidBallotIndex',
        message: 'Invalid ballot index',
    },
    [NCN_SNAPSHOT_ERROR__INVALID_SNAPSHOT_SLOT]: {
        code: 6013,
        name: 'invalidSnapshotSlot',
        message: 'Snapshot slot must be greater than current slot',
    },
    [NCN_SNAPSHOT_ERROR__BALLOT_TALLIES_NOT_MAX_LENGTH]: {
        code: 6014,
        name: 'ballotTalliesNotMaxLength',
        message: 'Ballot tallies not at max length',
    },
    [NCN_SNAPSHOT_ERROR__INVALID_PROPOSAL]: { code: 6015, name: 'invalidProposal', message: 'Invalid proposal' },
    [NCN_SNAPSHOT_ERROR__SNAPSHOT_SLOT_NOT_REACHED]: {
        code: 6016,
        name: 'snapshotSlotNotReached',
        message: 'Current slot must be greater than snapshot slot',
    },
};

export function getNcnSnapshotErrorFromCode(code: number): NcnSnapshotErrorInfo | undefined {
    return NCNSNAPSHOT_ERRORS[code as NcnSnapshotError];
}

export function getNcnSnapshotErrorMessage(code: NcnSnapshotError): string {
    return NCNSNAPSHOT_ERRORS[code].message;
}
