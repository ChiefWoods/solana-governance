import { Address } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export interface SupportPdaSeeds {
    proposal: Address;
    splVoteAccount: Address;
}

export async function findSupportPda(
    seeds: SupportPdaSeeds,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [
        Buffer.from('support', 'utf8'),
        seeds.proposal.toBytes(),
        seeds.splVoteAccount.toBytes(),
    ];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
