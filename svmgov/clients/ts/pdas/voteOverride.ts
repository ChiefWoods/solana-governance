import { Address } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export interface VoteOverridePdaSeeds {
    proposal: Address;
    splStakeAccount: Address;
    validatorVote: Address;
}

export async function findVoteOverridePda(
    seeds: VoteOverridePdaSeeds,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [
        Buffer.from('vote_override', 'utf8'),
        seeds.proposal.toBytes(),
        seeds.splStakeAccount.toBytes(),
        seeds.validatorVote.toBytes(),
    ];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
