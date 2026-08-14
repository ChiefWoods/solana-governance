import { z } from 'zod';

/** Foundation-run router for whitelisted NCN verifier services. */
export const DEFAULT_NCN_API_URL = 'https://ncn-governance.solana.com';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_BODY_SNIPPET_CHARS = 200;

const networkMetaSchema = z.object({
    created_at: z.string(),
    merkle_root: z.string(),
    network: z.string(),
    slot: z.number().int().nonnegative(),
    snapshot_hash: z.string(),
});

const voteAccountSchema = z.object({
    active_stake: z.number().int().nonnegative(),
    meta_merkle_proof: z.array(z.string()),
    network: z.string(),
    snapshot_slot: z.number().int().nonnegative(),
    stake_merkle_root: z.string(),
    vote_account: z.string(),
    voting_wallet: z.string(),
});

const stakeAccountSchema = z.object({
    active_stake: z.number().int().nonnegative(),
    network: z.string(),
    snapshot_slot: z.number().int().nonnegative(),
    stake_account: z.string(),
    stake_merkle_proof: z.array(z.string()),
    vote_account: z.string(),
    voting_wallet: z.string(),
});

const voterSummarySchema = z.object({
    network: z.string(),
    snapshot_slot: z.number().int().nonnegative(),
    stake_accounts: z.array(stakeAccountSchema),
    vote_accounts: z.array(voteAccountSchema),
    voting_wallet: z.string(),
});

const voteAccountProofSchema = z.object({
    meta_merkle_leaf: z.object({
        active_stake: z.number().int().nonnegative(),
        stake_merkle_root: z.string(),
        vote_account: z.string(),
        voting_wallet: z.string(),
    }),
    meta_merkle_proof: z.array(z.string()),
    network: z.string(),
    snapshot_slot: z.number().int().nonnegative(),
});

const stakeAccountProofSchema = z.object({
    network: z.string(),
    snapshot_slot: z.number().int().nonnegative(),
    stake_merkle_leaf: z.object({
        active_stake: z.number().int().nonnegative(),
        stake_account: z.string(),
        voting_wallet: z.string(),
    }),
    stake_merkle_proof: z.array(z.string()),
    vote_account: z.string(),
});

export type NetworkMeta = z.infer<typeof networkMetaSchema>;
export type VoterSummary = z.infer<typeof voterSummarySchema>;
export type VoteAccountProof = z.infer<typeof voteAccountProofSchema>;
export type StakeAccountProof = z.infer<typeof stakeAccountProofSchema>;

export class NcnVerifierServiceHttpError extends Error {
    readonly status: number;
    readonly host: string;
    readonly bodySnippet: string;

    constructor(
        label: string,
        status: number,
        { url, statusText, bodySnippet = '' }: { url: string; statusText?: string; bodySnippet?: string },
    ) {
        const host = new URL(url).host;
        super(`Failed to get ${label} from ${host}: ${statusText ? `${status} ${statusText}` : status}`);
        this.name = 'NcnVerifierServiceHttpError';
        this.status = status;
        this.host = host;
        this.bodySnippet = bodySnippet;
    }
}

export class NcnVerifierServiceNetworkError extends Error {
    readonly url: string;
    readonly host: string;

    constructor(message: string, url: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'NcnVerifierServiceNetworkError';
        this.url = url;
        this.host = new URL(url).host;
    }
}

export interface NcnVerifierServiceOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
}

/** Client for the public HTTP API served by NCN verifier operators. */
export class NcnVerifierService {
    readonly baseUrl: string;

    constructor(baseUrl = DEFAULT_NCN_API_URL) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }

    getMeta(network: string, options?: NcnVerifierServiceOptions): Promise<NetworkMeta> {
        return this.get('/meta', { network }, networkMetaSchema, 'snapshot meta info', options);
    }

    getVoterSummary(
        votingWallet: string,
        network: string,
        slot: number,
        options?: NcnVerifierServiceOptions,
    ): Promise<VoterSummary> {
        return this.get(
            `/voter/${encodeURIComponent(votingWallet)}`,
            { network, slot: String(slot) },
            voterSummarySchema,
            'voter summary',
            options,
        );
    }

    getVoteAccountProof(
        voteAccount: string,
        network: string,
        slot: number,
        options?: NcnVerifierServiceOptions,
    ): Promise<VoteAccountProof> {
        return this.get(
            `/proof/vote_account/${encodeURIComponent(voteAccount)}`,
            { network, slot: String(slot) },
            voteAccountProofSchema,
            'vote account proof',
            options,
        );
    }

    getStakeAccountProof(
        stakeAccount: string,
        network: string,
        slot: number,
        options?: NcnVerifierServiceOptions,
    ): Promise<StakeAccountProof> {
        return this.get(
            `/proof/stake_account/${encodeURIComponent(stakeAccount)}`,
            { network, slot: String(slot) },
            stakeAccountProofSchema,
            'stake account proof',
            options,
        );
    }

    private async get<T extends z.ZodType>(
        path: string,
        query: Record<string, string>,
        schema: T,
        label: string,
        { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: NcnVerifierServiceOptions = {},
    ): Promise<z.output<T>> {
        const url = new URL(path, `${this.baseUrl}/`);
        for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs);
        const abortFromCaller = () => controller.abort();
        signal?.addEventListener('abort', abortFromCaller);
        if (signal?.aborted) controller.abort();

        try {
            const response = await fetch(url.toString(), signal ? { signal: controller.signal } : undefined);
            if (!response.ok) {
                throw new NcnVerifierServiceHttpError(label, response.status, {
                    bodySnippet: await readBodySnippet(response),
                    statusText: response.statusText,
                    url: response.url || url.toString(),
                });
            }

            return schema.parse(await response.json());
        } catch (error) {
            if (signal?.aborted) throw error;
            if (timedOut) {
                throw new NcnVerifierServiceNetworkError(
                    `Timed out after ${timeoutMs}ms getting ${label} from ${url.host}`,
                    url.toString(),
                );
            }
            if (isNetworkFailure(error)) {
                throw new NcnVerifierServiceNetworkError(
                    `NCN API unreachable at ${url.host} while getting ${label} (network or CORS failure)`,
                    url.toString(),
                    { cause: error },
                );
            }
            throw error;
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abortFromCaller);
        }
    }
}

const readBodySnippet = async (response: Response): Promise<string> => {
    try {
        return (await response.text()).trim().slice(0, MAX_BODY_SNIPPET_CHARS);
    } catch {
        return '';
    }
};

const isNetworkFailure = (error: unknown): error is TypeError =>
    error instanceof TypeError &&
    /load failed|failed to fetch|fetch failed|networkerror|network request failed/i.test(error.message);
