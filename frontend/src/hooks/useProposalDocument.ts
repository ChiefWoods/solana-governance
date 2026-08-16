'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
    fetchProposalDocument,
    GithubApiError,
    type ProposalDocument,
    type ProposalRef,
} from '@/lib/github';
import { QUERY_KEYS } from '@/lib/queryKeys';

const STORAGE_KEY = 'proposal-docs-cache-v2';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const NEGATIVE_CACHE_TTL = 1000 * 60 * 60;
const MAX_CACHE_ENTRIES = 100;

type CacheEntry =
    | { document: ProposalDocument; fetchedAt: number; status: 'ok' }
    | { fetchedAt: number; reason: string; status: 'unsupported' };

type DocumentCache = Record<string, CacheEntry>;

export function useProposalDocument(githubUrl: string) {
    const cached = useMemo(() => readCache(githubUrl), [githubUrl]);

    return useQuery<ProposalDocument | null>({
        gcTime: CACHE_TTL * 2,
        initialData: cached && (cached.status === 'ok' ? cached.document : null),
        initialDataUpdatedAt: cached?.fetchedAt,
        queryFn: async ({ signal }) => {
            const result = await fetchProposalDocument(githubUrl, { signal });
            const fetchedAt = Date.now();

            if (result.status === 'unsupported') {
                writeCache(githubUrl, { fetchedAt, reason: result.reason, status: 'unsupported' });
                return null;
            }

            writeCache(githubUrl, { document: result.document, fetchedAt, status: 'ok' });
            return result.document;
        },
        queryKey: [QUERY_KEYS.GET_PROPOSAL_DOCUMENT, githubUrl],
        retry: (failureCount, error) => {
            if (error instanceof GithubApiError && !error.retryable) return false;
            return failureCount < 2;
        },
        staleTime: query => (query.state.data === null ? NEGATIVE_CACHE_TTL : CACHE_TTL),
    });
}

export function useProposalRef(githubUrl: string, fallback?: ProposalRef): ProposalRef | undefined {
    const { data } = useProposalDocument(githubUrl);
    return data?.ref ?? fallback;
}

function cacheKey(githubUrl: string): string {
    return githubUrl.trim();
}

function readCache(githubUrl: string): CacheEntry | undefined {
    if (typeof window === 'undefined') return undefined;

    const entry = loadCache()[cacheKey(githubUrl)];
    if (entry?.status !== 'ok' && entry?.status !== 'unsupported') return undefined;

    const ttl = entry.status === 'ok' ? CACHE_TTL : NEGATIVE_CACHE_TTL;
    return Date.now() - entry.fetchedAt < ttl ? entry : undefined;
}

function writeCache(githubUrl: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;
    const cache = loadCache();
    cache[cacheKey(githubUrl)] = entry;
    saveCache(evictOldest(cache));
}

function evictOldest(cache: DocumentCache): DocumentCache {
    const entries = Object.entries(cache);
    if (entries.length <= MAX_CACHE_ENTRIES) return cache;
    entries.sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);
    return Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
}

function loadCache(): DocumentCache {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as DocumentCache) : {};
    } catch {
        return {};
    }
}

function saveCache(cache: DocumentCache): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
        // ignore quota errors
    }
}
