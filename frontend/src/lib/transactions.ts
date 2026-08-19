import { getAddressEncoder, type Address, type TransactionModifyingSigner } from '@solana/kit';
import {
    findBallotBoxPda,
    findMetaMerkleProofPda,
    NCN_SNAPSHOT_PROGRAM_ADDRESS,
    StakeMerkleLeaf,
} from '@solana/ncn-snapshot';
import {
    getCastVoteInstructionAsync,
    getCastVoteOverrideInstructionAsync,
    getCreateProposalInstructionAsync,
    getModifyVoteInstructionAsync,
    getModifyVoteOverrideInstructionAsync,
    getSupportProposalInstructionAsync,
} from '@solana/svmgov';

import type { GlobalConfigAccount } from '@/contexts/GlobalConfigContext';
import { toVoteBasisPoints, type VoteDistribution } from '@/lib/voteDistribution';

import { EpochSchedule, EpochInfo } from '../../types/solana';

export function firstSlotOfEpoch(schedule: EpochSchedule, epoch: bigint) {
    return schedule.firstNormalSlot + (epoch - schedule.firstNormalEpoch) * schedule.slotsPerEpoch;
}

export function snapshotSlotForSupport(
    epochInfo: EpochInfo,
    schedule: EpochSchedule,
    globalConfig: GlobalConfigAccount,
) {
    const targetEpoch = epochInfo.epoch + globalConfig.discussionEpochs + globalConfig.snapshotEpochExtension;
    return firstSlotOfEpoch(schedule, targetEpoch) + globalConfig.snapshotSlotOffset;
}

export async function buildCreateProposalInstruction({
    description,
    signer,
    splVoteAccount,
    title,
}: {
    description: string;
    signer: TransactionModifyingSigner;
    splVoteAccount: Address;
    title: string;
}) {
    const seed = crypto.getRandomValues(new BigUint64Array(1))[0];

    // Note: uninitialized VoteStateVersions should be validated here

    return getCreateProposalInstructionAsync({
        description,
        seed,
        signer,
        splVoteAccount,
        title,
    });
}

export async function buildCastVoteInstruction({
    consensusResult,
    distribution,
    proposal,
    signer,
    splVoteAccount,
    voteAccount,
}: {
    consensusResult: Address;
    distribution: VoteDistribution;
    proposal: Address;
    signer: TransactionModifyingSigner;
    splVoteAccount: Address;
    voteAccount: Address;
}) {
    const [metaMerkleProof] = await findMetaMerkleProofPda({
        consensusResult,
        voteAccount,
    });

    return getCastVoteInstructionAsync({
        ...toVoteBasisPoints(distribution),
        consensusResult,
        metaMerkleProof,
        proposal,
        signer,
        snapshotProgram: NCN_SNAPSHOT_PROGRAM_ADDRESS,
        splVoteAccount,
    });
}

export async function buildCastVoteOverrideInstruction({
    consensusResult,
    distribution,
    proposal,
    signer,
    stakeAccount,
    stakeMerkleLeaf,
    stakeMerkleProof,
    voteAccount,
}: {
    consensusResult: Address;
    distribution: VoteDistribution;
    proposal: Address;
    signer: TransactionModifyingSigner;
    stakeAccount: Address;
    stakeMerkleLeaf: StakeMerkleLeaf;
    stakeMerkleProof: readonly Address[];
    voteAccount: Address;
}) {
    const [metaMerkleProof] = await findMetaMerkleProofPda({ consensusResult, voteAccount });

    return getCastVoteOverrideInstructionAsync({
        ...toVoteBasisPoints(distribution),
        consensusResult,
        metaMerkleProof,
        proposal,
        signer,
        snapshotProgram: NCN_SNAPSHOT_PROGRAM_ADDRESS,
        splStakeAccount: stakeAccount,
        splVoteAccount: voteAccount,
        stakeMerkleLeaf,
        stakeMerkleProof: stakeMerkleProof.map(node => getAddressEncoder().encode(node)),
    });
}

export async function buildModifyVoteInstruction({
    consensusResult,
    distribution,
    proposal,
    signer,
    splVoteAccount,
    voteAccount,
}: {
    consensusResult: Address;
    distribution: VoteDistribution;
    proposal: Address;
    signer: TransactionModifyingSigner;
    splVoteAccount: Address;
    voteAccount: Address;
}) {
    const [metaMerkleProof] = await findMetaMerkleProofPda({ consensusResult, voteAccount });

    return getModifyVoteInstructionAsync({
        ...toVoteBasisPoints(distribution),
        consensusResult,
        metaMerkleProof,
        proposal,
        signer,
        snapshotProgram: NCN_SNAPSHOT_PROGRAM_ADDRESS,
        splVoteAccount,
    });
}

export async function buildModifyVoteOverrideInstruction({
    consensusResult,
    distribution,
    proposal,
    signer,
    stakeAccount,
    stakeMerkleLeaf,
    stakeMerkleProof,
    voteAccount,
}: {
    consensusResult: Address;
    distribution: VoteDistribution;
    proposal: Address;
    signer: TransactionModifyingSigner;
    stakeAccount: Address;
    stakeMerkleLeaf: StakeMerkleLeaf;
    stakeMerkleProof: readonly Address[];
    voteAccount: Address;
}) {
    const [metaMerkleProof] = await findMetaMerkleProofPda({ consensusResult, voteAccount });

    return getModifyVoteOverrideInstructionAsync({
        ...toVoteBasisPoints(distribution),
        consensusResult,
        metaMerkleProof,
        proposal,
        signer,
        snapshotProgram: NCN_SNAPSHOT_PROGRAM_ADDRESS,
        splStakeAccount: stakeAccount,
        splVoteAccount: voteAccount,
        stakeMerkleLeaf,
        stakeMerkleProof: stakeMerkleProof.map(node => getAddressEncoder().encode(node)),
    });
}

export async function buildSupportProposalInstruction({
    proposal,
    signer,
    snapshotSlot,
    splVoteAccount,
}: {
    proposal: Address;
    signer: TransactionModifyingSigner;
    snapshotSlot: bigint;
    splVoteAccount: Address;
}) {
    const [ballotBox] = await findBallotBoxPda({ snapshotSlot });

    return getSupportProposalInstructionAsync({
        ballotBox,
        ballotProgram: NCN_SNAPSHOT_PROGRAM_ADDRESS,
        proposal,
        signer,
        splVoteAccount,
    });
}
