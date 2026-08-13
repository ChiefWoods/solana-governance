import { Address } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export interface VoteOverrideCachePdaSeeds {
    proposal: Address;
    vote: Address;
}

export async function findVoteOverrideCachePda(
    seeds: VoteOverrideCachePdaSeeds,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [
        Buffer.from('vote_override_cache', 'utf8'),
        seeds.proposal.toBytes(),
        seeds.vote.toBytes(),
    ];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
