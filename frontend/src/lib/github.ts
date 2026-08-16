import { Octokit } from '@octokit/rest';

import { SGP_REPO, SIMD_REPO } from '@/lib/constants';

export type ProposalNumberKind = 'simd' | 'sgp';

export interface GithubRepoRef {
    owner: string;
    repo: string;
}

export interface ProposalRef {
    number: string;
    kind: ProposalNumberKind;
    label: string;
}

export type UnsupportedUrlCode =
    | 'empty'
    | 'not-a-url'
    | 'not-https'
    | 'not-github'
    | 'tree-or-directory'
    | 'unrecognized';

export type ParsedProposalUrl =
    | {
          kind: 'blob';
          repo: GithubRepoRef;
          gitRef: string;
          path: string;
          fileName: string;
          ref: ProposalRef | undefined;
      }
    | { kind: 'pull'; repo: GithubRepoRef; pullNumber: number }
    | { kind: 'unsupported'; code: UnsupportedUrlCode; reason: string };

export interface ProposalFileRule {
    kind: ProposalNumberKind;
    pattern: RegExp;
}

export interface ProposalRepoConfig {
    proposalDir: string | undefined;
    fileRules: ProposalFileRule[];
    defaultKind: ProposalNumberKind;
}

export interface PullRequestFile {
    filename: string;
    status: string;
    contents_url: string;
}

export interface PickedProposalFile {
    path: string;
    headSha: string;
    ref: ProposalRef | undefined;
}

export type PickProposalFileResult =
    | { status: 'ok'; file: PickedProposalFile }
    | { status: 'none' }
    | { status: 'ambiguous'; paths: string[] };

export type ProposalUrlErrorCode =
    | 'empty'
    | 'not-a-url'
    | 'not-https'
    | 'not-github'
    | 'pull-request'
    | 'tree-or-directory'
    | 'not-markdown'
    | 'query-or-fragment'
    | 'too-long'
    | 'rejected-on-chain'
    | 'unsupported';

export type ProposalUrlWarningCode = 'mutable-ref' | 'unknown-repo' | 'unrecognized-filename';

export interface ProposalUrlIssue<Code extends string> {
    code: Code;
    message: string;
}

export interface ProposalUrlValidation {
    ok: boolean;
    errors: ProposalUrlIssue<ProposalUrlErrorCode>[];
    warnings: ProposalUrlIssue<ProposalUrlWarningCode>[];
    parsed: ParsedProposalUrl;
    normalized: string;
}

export interface ProposalDocument {
    ref: ProposalRef | undefined;
    summary: string;
    sourceUrl: string;
    fetchedAt: number;
}

export type ProposalDocumentResult =
    | { status: 'ok'; document: ProposalDocument }
    | { status: 'unsupported'; reason: string };

export interface FetchProposalDocumentOptions {
    signal?: AbortSignal;
}

export class GithubApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
        readonly retryable: boolean,
    ) {
        super(message);
        this.name = 'GithubApiError';
    }
}

const SIMD_RULE: ProposalFileRule = {
    kind: 'simd',
    pattern: /^(\d{1,5})(?:[-_.].*)?\.md$/i,
};
const SGP_RULE: ProposalFileRule = {
    kind: 'sgp',
    pattern: /^sgp-(\d{1,5})(?:[-_.].*)?\.md$/i,
};
const REPO_CONFIGS: Record<string, ProposalRepoConfig> = {
    [SIMD_REPO]: {
        defaultKind: 'simd',
        fileRules: [SIMD_RULE],
        proposalDir: 'proposals',
    },
    [SGP_REPO]: {
        defaultKind: 'sgp',
        fileRules: [SGP_RULE],
        proposalDir: 'proposals',
    },
};
const DEFAULT_REPO_CONFIG: ProposalRepoConfig = {
    defaultKind: 'simd',
    fileRules: [SGP_RULE, SIMD_RULE],
    proposalDir: undefined,
};
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const NUMBER_LINE = /^[ \t]*(simd|sgp)[ \t]*:[ \t]*['"]?(\d+)['"]?[ \t]*$/im;
const SUMMARY_HEADING = /^#{1,6}[ \t]*summary[ \t]*:?[ \t]*$/i;
const ANY_HEADING = /^#{1,6}[ \t]/;
const TITLE_PREFIX = /^#?\s*(simd|sgp)[\s-]*0*(\d{1,5})\b/i;
const COMMIT_SHA = /^[0-9a-f]{40}$/i;
const ON_CHAIN_PREFIX = 'https://github.com/';
const ON_CHAIN_DISALLOWED_CHAR = /[^\p{Alphabetic}\p{N}\-_./]/u;
const PULL_REQUEST_MESSAGE = [
    'Link to the proposal markdown file, not to a pull request.',
    '',
    'Open the PR\'s "Files changed" tab, click the proposal .md file, and copy its URL — it looks like',
    'https://github.com/<owner>/<repo>/blob/<commit-sha>/proposals/sgp-0001-....md',
].join('\n');
const MAX_PULL_FILE_PAGES = 3;

function repoKey({ owner, repo }: GithubRepoRef): string {
    return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

export function isKnownProposalRepo(repo: GithubRepoRef): boolean {
    return repoKey(repo) in REPO_CONFIGS;
}

export function resolveRepoConfig(repo: GithubRepoRef): ProposalRepoConfig {
    return REPO_CONFIGS[repoKey(repo)] ?? DEFAULT_REPO_CONFIG;
}

export function makeProposalRef(number: string, kind: ProposalNumberKind): ProposalRef {
    return { kind, label: `${kind.toUpperCase()}-${number}`, number };
}

export function proposalRefFromFileName(fileName: string, config: ProposalRepoConfig): ProposalRef | undefined {
    for (const rule of config.fileRules) {
        const match = fileName.match(rule.pattern);
        if (match) return makeProposalRef(match[1], rule.kind);
    }
    return undefined;
}

export function rawContentUrl(repo: GithubRepoRef, gitRef: string, path: string): string {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/${encodeURIComponent(gitRef)}/${encodedPath}`;
}

function unsupported(code: UnsupportedUrlCode, reason: string): ParsedProposalUrl {
    return { code, kind: 'unsupported', reason };
}

/** Classifies GitHub blob and pull-request URLs without making a request. */
export function parseProposalUrl(rawUrl: string): ParsedProposalUrl {
    const trimmed = rawUrl?.trim() ?? '';
    if (!trimmed) return unsupported('empty', 'No URL provided');

    let url: URL;
    try {
        url = new URL(trimmed);
    } catch {
        return unsupported('not-a-url', `Not a valid URL: ${trimmed}`);
    }
    if (url.protocol !== 'https:') {
        return unsupported('not-https', 'URL must use https');
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const segments = url.pathname.split('/').filter(Boolean).map(decodeSegment);
    if (host === 'raw.githubusercontent.com') {
        if (segments.length < 4) {
            return unsupported('unrecognized', 'Not a raw file URL');
        }
        const [owner, repo, gitRef, ...pathParts] = segments;
        return blobResult({ owner, repo }, gitRef, pathParts);
    }
    if (host !== 'github.com') {
        return unsupported('not-github', `Not a github.com URL: ${url.hostname}`);
    }
    if (segments.length < 2) {
        return unsupported('unrecognized', 'URL does not name a repository');
    }

    const [owner, repo, kind, ...rest] = segments;
    if (kind === 'blob' || kind === 'raw') {
        if (rest.length < 2) {
            return unsupported('unrecognized', 'URL does not name a file');
        }
        const [gitRef, ...pathParts] = rest;
        return blobResult({ owner, repo }, gitRef, pathParts);
    }
    if (kind === 'tree') {
        return unsupported('tree-or-directory', 'URL points at a directory listing, not a file');
    }
    if (kind === 'pull' || kind === 'pulls') {
        const pullNumber = Number(rest[0]);
        if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
            return unsupported('unrecognized', 'Pull request URL has no number');
        }
        return { kind: 'pull', pullNumber, repo: { owner, repo } };
    }
    return unsupported(
        'unrecognized',
        kind ? `Unrecognized GitHub URL type: /${kind}/` : 'URL points at a repository root, not a file',
    );
}

function blobResult(repo: GithubRepoRef, gitRef: string, pathParts: string[]): ParsedProposalUrl {
    const path = pathParts.join('/');
    const fileName = pathParts.at(-1) ?? '';
    return {
        fileName,
        gitRef,
        kind: 'blob',
        path,
        ref: proposalRefFromFileName(fileName, resolveRepoConfig(repo)),
        repo,
    };
}

function decodeSegment(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

export function getProposalRefFromUrl(url: string): ProposalRef | undefined {
    const parsed = parseProposalUrl(url);
    return parsed.kind === 'blob' ? parsed.ref : undefined;
}

export function pickProposalFile(files: PullRequestFile[], config: ProposalRepoConfig): PickProposalFileResult {
    const candidates = files.flatMap(file => {
        if (file.status === 'removed') return [];
        const ref = proposalRefFromFileName(basename(file.filename), config);
        if (!ref || (config.proposalDir !== undefined && dirname(file.filename) !== config.proposalDir)) {
            return [];
        }
        const headSha = headShaFromContentsUrl(file.contents_url);
        return headSha ? [{ file, headSha, path: file.filename, ref }] : [];
    });
    if (candidates.length === 0) return { status: 'none' };
    const added = candidates.filter(({ file }) => file.status === 'added');
    const contenders = added.length > 0 ? added : candidates;
    if (contenders.length > 1) {
        return { paths: contenders.map(({ path }) => path).sort(), status: 'ambiguous' };
    }
    const { path, headSha, ref } = contenders[0];
    return { file: { headSha, path, ref }, status: 'ok' };
}

export function headShaFromContentsUrl(contentsUrl: string): string | undefined {
    try {
        return new URL(contentsUrl).searchParams.get('ref') ?? undefined;
    } catch {
        return undefined;
    }
}

function basename(path: string): string {
    return path.split('/').at(-1) ?? '';
}

function dirname(path: string): string {
    const index = path.lastIndexOf('/');
    return index === -1 ? '' : path.slice(0, index);
}

export function splitFrontmatter(text: string): {
    frontmatter: string | undefined;
    body: string;
} {
    const match = text.match(FRONTMATTER);
    if (!match) return { body: text, frontmatter: undefined };
    return {
        body: text.slice(match[0].length).replace(/^(?:\r?\n)+/, ''),
        frontmatter: match[1],
    };
}

export function parseProposalMarkdown(
    text: string,
    fallbackRef?: ProposalRef,
): { ref: ProposalRef | undefined; summary: string } {
    const { frontmatter, body } = splitFrontmatter(text);
    const match = frontmatter?.match(NUMBER_LINE);
    const ref = match ? makeProposalRef(match[2], match[1].toLowerCase() as ProposalNumberKind) : fallbackRef;
    return { ref, summary: extractSummary(body) };
}

function extractSummary(body: string): string {
    const lines = body.split(/\r?\n/);
    const headingIndex = lines.findIndex(line => SUMMARY_HEADING.test(line));
    if (headingIndex !== -1) {
        const rest = lines.slice(headingIndex + 1);
        const endIndex = rest.findIndex(line => ANY_HEADING.test(line));
        const summary = (endIndex === -1 ? rest : rest.slice(0, endIndex)).join('\n').trim();
        if (summary) return summary;
    }
    const paragraph: string[] = [];
    for (const line of lines) {
        if (ANY_HEADING.test(line)) {
            if (paragraph.length > 0) break;
            continue;
        }
        if (!line.trim()) {
            if (paragraph.length > 0) break;
            continue;
        }
        paragraph.push(line);
    }
    const summary = paragraph.join('\n').trim();
    return summary.length > 600 ? `${summary.slice(0, 600).trimEnd()}…` : summary;
}

export function titleNamesProposal(title: string, ref: ProposalRef): boolean {
    const match = title.trimStart().match(TITLE_PREFIX);
    return Boolean(match && match[1].toLowerCase() === ref.kind && Number(match[2]) === Number(ref.number));
}

export function formatProposalHeading(ref: ProposalRef | undefined, title: string): string {
    return !ref || titleNamesProposal(title, ref) ? title : `${ref.label}: ${title}`;
}

export function validateProposalUrl(url: string): ProposalUrlValidation {
    const errors: ProposalUrlIssue<ProposalUrlErrorCode>[] = [];
    const warnings: ProposalUrlIssue<ProposalUrlWarningCode>[] = [];
    const normalized = url?.trim() ?? '';
    const parsed = parseProposalUrl(normalized);
    const fail = (code: ProposalUrlErrorCode, message: string): ProposalUrlValidation => ({
        errors: [...errors, { code, message }],
        normalized,
        ok: false,
        parsed,
        warnings,
    });

    if (parsed.kind === 'pull') return fail('pull-request', PULL_REQUEST_MESSAGE);
    if (parsed.kind === 'unsupported') {
        const messages: Record<UnsupportedUrlCode, [ProposalUrlErrorCode, string]> = {
            empty: ['empty', 'A GitHub link is required.'],
            'not-a-url': ['not-a-url', 'This is not a valid URL.'],
            'not-github': ['not-github', 'The link must point at github.com.'],
            'not-https': ['not-https', 'The link must start with https://.'],
            'tree-or-directory': [
                'tree-or-directory',
                'This links to a directory. Link to the proposal markdown file itself.',
            ],
            unrecognized: [
                'unsupported',
                'Link to a file on GitHub, e.g. https://github.com/<owner>/<repo>/blob/<ref>/proposals/sgp-0001-....md',
            ],
        };
        return fail(...messages[parsed.code]);
    }
    if (!normalized.startsWith(ON_CHAIN_PREFIX)) {
        return fail(
            'not-github',
            `The link must start with ${ON_CHAIN_PREFIX} — no "www.", and not raw.githubusercontent.com.`,
        );
    }
    if (!/\.md$/i.test(parsed.fileName)) {
        errors.push({ code: 'not-markdown', message: 'The link must point at a .md file.' });
    }
    if (/[?#]/.test(normalized)) {
        errors.push({
            code: 'query-or-fragment',
            message: 'Remove the query string or #fragment — the on-chain program rejects them.',
        });
    }
    if (new TextEncoder().encode(normalized).length > 500) {
        errors.push({ code: 'too-long', message: 'The link must be at most 500 bytes.' });
    }
    const onChainIssue = describeOnChainViolation(normalized);
    if (onChainIssue) errors.push({ code: 'rejected-on-chain', message: onChainIssue });
    if (!COMMIT_SHA.test(parsed.gitRef)) {
        warnings.push({
            code: 'mutable-ref',
            message: `"${parsed.gitRef}" is a branch or tag. The description cannot be changed once on chain, so a full commit SHA is safer.`,
        });
    }
    if (!isKnownProposalRepo(parsed.repo)) {
        warnings.push({
            code: 'unknown-repo',
            message: `${parsed.repo.owner}/${parsed.repo.repo} is not a recognized proposal repository.`,
        });
    }
    if (!parsed.ref) {
        warnings.push({
            code: 'unrecognized-filename',
            message: `"${parsed.fileName}" does not look like a proposal filename (expected sgp-0001-title.md or 0001-title.md), so no proposal number will be shown.`,
        });
    }
    return { errors, normalized, ok: errors.length === 0, parsed, warnings };
}

export function assertValidProposalUrl(url: string): string {
    const result = validateProposalUrl(url);
    if (!result.ok) throw new Error(result.errors[0].message);
    return result.normalized;
}

function describeOnChainViolation(url: string): string | undefined {
    const path = url.slice(ON_CHAIN_PREFIX.length).replace(/\/$/, '');
    const segments = path.split('/');
    if (segments.some(segment => !segment)) {
        return 'The link contains an empty path segment, which the on-chain program rejects.';
    }
    if (segments.length < 2 || segments.length > 10) {
        return `The link has ${segments.length} path segments; the on-chain program accepts 2-10.`;
    }
    const bad = path.match(ON_CHAIN_DISALLOWED_CHAR);
    return bad
        ? `The link contains "${bad[0]}", which the on-chain program rejects; only letters, digits, "-", "_" and "." are allowed in the path.`
        : undefined;
}

export async function fetchProposalDocument(
    url: string,
    options: FetchProposalDocumentOptions = {},
): Promise<ProposalDocumentResult> {
    const parsed = parseProposalUrl(url);
    if (parsed.kind === 'unsupported') {
        return { reason: parsed.reason, status: 'unsupported' };
    }
    if (parsed.kind === 'blob') {
        const sourceUrl = rawContentUrl(parsed.repo, parsed.gitRef, parsed.path);
        const text = await fetchRawMarkdown(sourceUrl, options.signal);
        return text === undefined
            ? { reason: `File not found: ${url}`, status: 'unsupported' }
            : buildDocument(text, parsed.ref, sourceUrl);
    }
    const files = await listPullRequestFiles(parsed.repo, parsed.pullNumber, options.signal);
    if (!files) {
        return { reason: `Pull request #${parsed.pullNumber} was not found`, status: 'unsupported' };
    }
    const picked = pickProposalFile(files, resolveRepoConfig(parsed.repo));
    if (picked.status === 'none') {
        return {
            reason: `Pull request #${parsed.pullNumber} does not change a proposal document`,
            status: 'unsupported',
        };
    }
    if (picked.status === 'ambiguous') {
        return {
            reason: `Pull request #${parsed.pullNumber} changes ${picked.paths.length} proposal documents (${picked.paths.join(', ')}), so the description does not identify one`,
            status: 'unsupported',
        };
    }
    const sourceUrl = rawContentUrl(parsed.repo, picked.file.headSha, picked.file.path);
    const text = await fetchRawMarkdown(sourceUrl, options.signal);
    return text === undefined
        ? {
              reason: `Proposal file from pull request #${parsed.pullNumber} is no longer available`,
              status: 'unsupported',
          }
        : buildDocument(text, picked.file.ref, sourceUrl);
}

function buildDocument(text: string, ref: ProposalRef | undefined, sourceUrl: string): ProposalDocumentResult {
    const parsed = parseProposalMarkdown(text, ref);
    return { document: { ...parsed, fetchedAt: Date.now(), sourceUrl }, status: 'ok' };
}

async function fetchRawMarkdown(sourceUrl: string, signal?: AbortSignal): Promise<string | undefined> {
    const response = await fetch(sourceUrl, { signal });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
    return response.text();
}

async function listPullRequestFiles(
    repo: GithubRepoRef,
    pullNumber: number,
    signal?: AbortSignal,
): Promise<PullRequestFile[] | undefined> {
    const octokit = new Octokit();
    const files: PullRequestFile[] = [];
    for (let page = 1; page <= MAX_PULL_FILE_PAGES; page += 1) {
        try {
            const response = await octokit.rest.pulls.listFiles({
                owner: repo.owner,
                page,
                per_page: 100,
                pull_number: pullNumber,
                repo: repo.repo,
                request: { signal },
            });
            files.push(...response.data);
            if (response.data.length < 100) break;
        } catch (error) {
            const status = errorStatus(error);
            if (status === 404 && page === 1) return undefined;
            throw errorForApiError(error, pullNumber);
        }
    }
    return files;
}

function errorStatus(error: unknown): number {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 0;
}

function errorHeaders(error: unknown): Headers | undefined {
    if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
    const headers = (error.response as { headers?: unknown }).headers;
    return headers instanceof Headers ? headers : undefined;
}

function errorForApiError(error: unknown, pullNumber: number): GithubApiError {
    const status = errorStatus(error);
    const headers = errorHeaders(error);
    const remaining = headers?.get('x-ratelimit-remaining');
    const retryAfter = headers?.get('retry-after');
    if (status === 429 || (status === 403 && remaining === '0')) {
        return new GithubApiError(
            status,
            'GitHub API rate limit exceeded (60 requests/hour for unauthenticated clients)',
            false,
        );
    }
    if (status === 403 && retryAfter) {
        return new GithubApiError(status, `GitHub secondary rate limit reached; retry after ${retryAfter}s`, false);
    }
    if (status === 403 || status === 404) {
        return new GithubApiError(
            status,
            `GitHub returned ${status} for pull request #${pullNumber}; the repository may be private or removed`,
            false,
        );
    }
    return new GithubApiError(status, `Failed to list files for pull request #${pullNumber}`, true);
}
