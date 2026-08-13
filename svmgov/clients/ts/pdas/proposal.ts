import { Address } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export interface ProposalPdaSeeds {
    seed: bigint;
    splVoteAccount: Address;
}

export async function findProposalPda(
    seeds: ProposalPdaSeeds,
    programId: Address = SVMGOVPROGRAM_PROGRAM_ID,
): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [
        Buffer.from('proposal', 'utf8'),
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(seeds.seed)]).buffer)),
        seeds.splVoteAccount.toBytes(),
    ];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
