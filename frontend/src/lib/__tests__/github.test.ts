import { afterEach, describe, expect, it, vi } from 'vitest';

import { SGP_REPO } from '../constants';
import { fetchProposalDocument, formatProposalHeading, parseProposalUrl, validateProposalUrl } from '../github';

const HEAD_SHA = '27bca51e5c0fc34ddbea6904faf86f5098225316';

function response(body: unknown, contentType = 'application/json'): Response {
    return new Response(contentType === 'application/json' ? JSON.stringify(body) : String(body), {
        headers: { 'content-type': contentType },
        status: 200,
    });
}

describe('GitHub proposal utilities', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('classifies a proposal pull request', () => {
        expect(parseProposalUrl(`https://github.com/${SGP_REPO}/pull/3/files`)).toEqual({
            kind: 'pull',
            pullNumber: 3,
            repo: { owner: 'solana-foundation', repo: 'solana-governance-proposals' },
        });
    });

    it('validates a pinned SGP document URL', () => {
        expect(
            validateProposalUrl(
                `https://github.com/${SGP_REPO}/blob/${HEAD_SHA}/proposals/sgp-0001-solana-constitution.md`,
            ).ok,
        ).toBe(true);
    });

    it('does not duplicate a proposal number in its heading', () => {
        expect(
            formatProposalHeading(
                { kind: 'sgp', label: 'SGP-0003', number: '0003' },
                'SGP-0003: Resource and Inclusion Fee',
            ),
        ).toBe('SGP-0003: Resource and Inclusion Fee');
    });

    it('resolves a proposal document changed by a pull request', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                response([
                    {
                        contents_url: `https://api.github.com/repos/${SGP_REPO}/contents/proposals%2Fsgp-0001-solana-constitution.md?ref=${HEAD_SHA}`,
                        filename: 'proposals/sgp-0001-solana-constitution.md',
                        status: 'added',
                    },
                ]),
            )
            .mockResolvedValueOnce(
                response('---\nsgp: 0001\n---\n\n## Summary\n\nRatifies the Constitution.\n', 'text/markdown'),
            );

        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchProposalDocument(`https://github.com/${SGP_REPO}/pull/3`)).resolves.toMatchObject({
            document: {
                ref: { label: 'SGP-0001' },
                summary: 'Ratifies the Constitution.',
            },
            status: 'ok',
        });
    });

    it('does not retry an exhausted GitHub API quota', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(null, {
                headers: { 'x-ratelimit-remaining': '0' },
                status: 403,
            }),
        );

        vi.stubGlobal('fetch', fetchMock);

        const error = await fetchProposalDocument(`https://github.com/${SGP_REPO}/pull/3`).catch(error => error);

        expect(error).toMatchObject({ retryable: false, status: 403 });
    });
});
