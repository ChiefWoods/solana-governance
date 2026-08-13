import { Address } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export interface BallotBoxPdaSeeds {
    snapshotSlot: bigint;
}

export async function findBallotBoxPda(
    seeds: BallotBoxPdaSeeds,
    programId: Address = NCNSNAPSHOT_PROGRAM_ID,
): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [
        Buffer.from('BallotBox', 'utf8'),
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(seeds.snapshotSlot)]).buffer)),
    ];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
