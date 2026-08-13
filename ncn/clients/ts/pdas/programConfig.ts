import { Address } from '@solana/web3.js';
import { NCNSNAPSHOT_PROGRAM_ID } from '../programs/ncnSnapshot';

export async function findProgramConfigPda(programId: Address = NCNSNAPSHOT_PROGRAM_ID): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [Buffer.from('ProgramConfig', 'utf8')];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
