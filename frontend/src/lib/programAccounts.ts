import {
    getAddressEncoder,
    getBase64Decoder,
    parseBase64RpcAccount,
    type Account,
    type Address,
    type Base64EncodedBytes,
    type GetProgramAccountsApi,
    type ReadonlyUint8Array,
    type Rpc,
} from '@solana/kit';
import {
    decodeProposal,
    decodeSupport,
    decodeVote,
    PROPOSAL_DISCRIMINATOR,
    SUPPORT_DISCRIMINATOR,
    SVMGOV_PROGRAM_ADDRESS,
    VOTE_DISCRIMINATOR,
    type Proposal,
    type Support,
    type Vote,
} from '@solana/svmgov';

const SUPPORT_PROPOSAL_OFFSET = 8n;
const VOTE_PROPOSAL_OFFSET = 40n;

function toBase64Bytes(bytes: ReadonlyUint8Array): Base64EncodedBytes {
    return getBase64Decoder().decode(bytes) as Base64EncodedBytes;
}

const PROPOSAL_DISCRIMINATOR_BASE64 = toBase64Bytes(PROPOSAL_DISCRIMINATOR);
const SUPPORT_DISCRIMINATOR_BASE64 = toBase64Bytes(SUPPORT_DISCRIMINATOR);
const VOTE_DISCRIMINATOR_BASE64 = toBase64Bytes(VOTE_DISCRIMINATOR);

function memcmp(offset: bigint, bytes: Base64EncodedBytes) {
    return {
        memcmp: {
            bytes,
            encoding: 'base64' as const,
            offset,
        },
    };
}

export async function fetchAllProposals(rpc: Rpc<GetProgramAccountsApi>): Promise<Account<Proposal>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [memcmp(0n, PROPOSAL_DISCRIMINATOR_BASE64)],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeProposal(parseBase64RpcAccount(pubkey, account)));
}

export async function fetchProposalSupports(
    rpc: Rpc<GetProgramAccountsApi>,
    proposalAddress: Address,
): Promise<Account<Support>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                memcmp(0n, SUPPORT_DISCRIMINATOR_BASE64),
                memcmp(SUPPORT_PROPOSAL_OFFSET, toBase64Bytes(getAddressEncoder().encode(proposalAddress))),
            ],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeSupport(parseBase64RpcAccount(pubkey, account)));
}

export async function fetchProposalVotes(
    rpc: Rpc<GetProgramAccountsApi>,
    proposalAddress: Address,
): Promise<Account<Vote>[]> {
    const accounts = await rpc
        .getProgramAccounts(SVMGOV_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                memcmp(0n, VOTE_DISCRIMINATOR_BASE64),
                memcmp(VOTE_PROPOSAL_OFFSET, toBase64Bytes(getAddressEncoder().encode(proposalAddress))),
            ],
        })
        .send();

    return accounts.map(({ account, pubkey }) => decodeVote(parseBase64RpcAccount(pubkey, account)));
}
