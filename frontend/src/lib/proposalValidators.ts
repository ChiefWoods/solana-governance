import { formatPercent, formatSol, percentOf, truncateAddress } from '@/lib/format';
import type { Validator } from '@/lib/stakewiz';

export const VOTE_CHOICES = ['For', 'Against', 'Abstain'] as const;

export type SupportingValidatorVote = (typeof VOTE_CHOICES)[number];

export const VOTE_TEXT_CLASS: Record<SupportingValidatorVote, string> = {
    Abstain: 'text-muted-foreground',
    Against: 'text-dao-status-failed',
    For: 'text-dao-status-finalized',
};

export const VOTE_DOT_CLASS: Record<SupportingValidatorVote, string> = {
    Abstain: 'bg-muted-foreground/60',
    Against: 'bg-dao-status-failed',
    For: 'bg-dao-status-finalized',
};

export type SupportingValidatorRow = {
    address: string;
    logo?: string;
    name: string;
    percent: string;
    stake: string;
    vote?: SupportingValidatorVote;
    voteAddresses?: string[];
};

export type ClusterVoteAccount = {
    activatedStake: bigint | number;
    nodePubkey: string;
    votePubkey: string;
};

function toLamports(value: bigint | number): bigint {
    return typeof value === 'bigint' ? value : BigInt(Math.round(value));
}

export function voteChoice(vote: {
    abstainVotesLamports: bigint;
    againstVotesLamports: bigint;
    forVotesLamports: bigint;
}): SupportingValidatorVote {
    if (vote.forVotesLamports >= vote.againstVotesLamports && vote.forVotesLamports >= vote.abstainVotesLamports) {
        return 'For';
    }
    if (vote.againstVotesLamports >= vote.abstainVotesLamports) {
        return 'Against';
    }
    return 'Abstain';
}

export function stakeForIdentity(identity: string, voteAccounts: readonly ClusterVoteAccount[]): bigint {
    let total = 0n;
    for (const voteAccount of voteAccounts) {
        if (voteAccount.nodePubkey === identity) {
            total += toLamports(voteAccount.activatedStake);
        }
    }
    return total;
}

function validatorMeta(identity: string, validators: readonly Validator[] | undefined) {
    const match = validators?.find(
        validator => validator.identity === identity || validator.vote_identity === identity,
    );

    return {
        logo: match?.image ?? undefined,
        name: match?.name || 'Unknown',
    };
}

function voteAddressesForIdentity(
    identity: string,
    voteAccounts: readonly ClusterVoteAccount[],
    validators?: readonly Validator[],
): string[] {
    const addresses: string[] = [];
    for (const voteAccount of voteAccounts) {
        if (voteAccount.nodePubkey === identity || voteAccount.votePubkey === identity) {
            addresses.push(voteAccount.votePubkey);
        }
    }
    const wiz = validators?.find(validator => validator.identity === identity || validator.vote_identity === identity);
    if (wiz?.vote_identity && !addresses.includes(wiz.vote_identity)) {
        addresses.push(wiz.vote_identity);
    }
    return addresses;
}

function toRow(
    identity: string,
    stakeLamports: bigint,
    totalStakedLamports: bigint,
    validators: readonly Validator[] | undefined,
    voteAccounts: readonly ClusterVoteAccount[],
    vote?: SupportingValidatorVote,
): SupportingValidatorRow {
    const { logo, name } = validatorMeta(identity, validators);
    const voteAddresses = voteAddressesForIdentity(identity, voteAccounts, validators);

    return {
        address: identity,
        logo,
        name,
        percent: formatPercent(percentOf(stakeLamports, totalStakedLamports)),
        stake: formatSol(stakeLamports),
        vote,
        voteAddresses: voteAddresses.length > 0 ? voteAddresses : undefined,
    };
}

export function mapSupportValidatorRows(
    supports: readonly { validator: string }[],
    voteAccounts: readonly ClusterVoteAccount[],
    totalStakedLamports: bigint,
    validators?: readonly Validator[],
): SupportingValidatorRow[] {
    return supports
        .map(support => {
            const stakeLamports = stakeForIdentity(support.validator, voteAccounts);
            return {
                row: toRow(support.validator, stakeLamports, totalStakedLamports, validators, voteAccounts),
                stakeLamports,
            };
        })
        .toSorted((a, b) => (a.stakeLamports < b.stakeLamports ? 1 : a.stakeLamports > b.stakeLamports ? -1 : 0))
        .map(({ row }) => row);
}

export function mapVoteValidatorRows(
    votes: readonly {
        abstainVotesLamports: bigint;
        againstVotesLamports: bigint;
        forVotesLamports: bigint;
        stake: bigint;
        validator: string;
    }[],
    voteAccounts: readonly ClusterVoteAccount[],
    totalStakedLamports: bigint,
    validators?: readonly Validator[],
): SupportingValidatorRow[] {
    return votes
        .map(vote => {
            const snapshotStake = toLamports(vote.stake);
            const stakeLamports = snapshotStake > 0n ? snapshotStake : stakeForIdentity(vote.validator, voteAccounts);
            return {
                row: toRow(
                    vote.validator,
                    stakeLamports,
                    totalStakedLamports,
                    validators,
                    voteAccounts,
                    voteChoice(vote),
                ),
                stakeLamports,
            };
        })
        .toSorted((a, b) => (a.stakeLamports < b.stakeLamports ? 1 : a.stakeLamports > b.stakeLamports ? -1 : 0))
        .map(({ row }) => row);
}

export function supportingValidatorRowMatchesSearch(row: SupportingValidatorRow, query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;

    const compactNeedle = needle.replace(/[\s._-]+/g, '');
    const values = [row.name, row.address, ...(row.voteAddresses ?? [])];

    return values.some(value => {
        const lower = value.toLowerCase();
        const truncated = truncateAddress(value).toLowerCase();
        return (
            lower.includes(needle) ||
            truncated.includes(needle) ||
            lower.replace(/[\s._-]+/g, '').includes(compactNeedle)
        );
    });
}
