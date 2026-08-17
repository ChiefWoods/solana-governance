import type { ReactNode } from 'react';

export function StatusPage({
    children,
    code,
    description,
    detail,
    title,
}: {
    children?: ReactNode;
    code: string;
    description: string;
    detail?: string;
    title: string;
}) {
    return (
        <main className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">{code}</p>
            <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
            {detail && <p className="mt-4 font-mono text-xs text-muted-foreground">{detail}</p>}
            {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-2">{children}</div>}
        </main>
    );
}
