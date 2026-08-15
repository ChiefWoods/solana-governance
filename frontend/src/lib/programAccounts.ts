import {
    getBase64Decoder,
    parseBase64RpcAccount,
    type Account,
    type Base64EncodedBytes,
    type GetProgramAccountsApi,
    type Rpc,
} from '@solana/kit';
import { decodeProposal, PROPOSAL_DISCRIMINATOR, SVMGOV_PROGRAM_ADDRESS, type Proposal } from '@solana/svmgov';

const PROPOSAL_DISCRIMINATOR_BASE64 = getBase64Decoder().decode(PROPOSAL_DISCRIMINATOR) as Base64EncodedBytes;

export async function fetchAllProposals(rpc: Rpc<GetProgramAccountsApi>): Promise<Account<Proposal>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                {
                    memcmp: {
                        bytes: PROPOSAL_DISCRIMINATOR_BASE64,
                        encoding: 'base64',
                        offset: BigInt(0),
                    },
                },
            ],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeProposal(parseBase64RpcAccount(pubkey, account)));
}
