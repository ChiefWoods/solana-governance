import { Address } from '@solana/web3.js';
import { SVMGOVPROGRAM_PROGRAM_ID } from '../programs/svmgovProgram';

export async function findProgramConfigPda(programId: Address = SVMGOVPROGRAM_PROGRAM_ID): Promise<[Address, number]> {
    const seedsBuffer: Uint8Array[] = [Buffer.from('ProgramConfig', 'utf8')];
    return await Address.findProgramAddress(seedsBuffer, programId);
}
