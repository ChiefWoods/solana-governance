'use client';

import type { MouseEvent } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'code', 'ul', 'ol', 'li', 'br'];

function stopLinkNavigationBubble(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
}

const components: Components = {
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            onClick={stopLinkNavigationBubble}
            className="wrap-break-word break-all text-primary underline-offset-2 hover:underline"
        >
            {children}
        </a>
    ),
    code: ({ children }) => (
        <code className="wrap-break-word break-all rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
            {children}
        </code>
    ),
    em: ({ children }) => <em>{children}</em>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
};

export function ProposalSummaryMarkdown({ summary }: { summary: string }) {
    if (!summary) return null;

    return (
        <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed components={components}>
            {summary}
        </ReactMarkdown>
    );
}
