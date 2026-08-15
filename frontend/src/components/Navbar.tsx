'use client';

import { BookText, LayoutDashboard, Menu, Scroll, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ConnectButton } from '@/components/connectorkit/ConnectButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { env } from '@/env';
import { cn } from '@/lib/utils';

type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
};

const navLinks: NavLink[] = [
    { href: '/proposals', label: 'Proposals', icon: Scroll },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
        href: env.NEXT_PUBLIC_DOCS_URL,
        label: 'Docs',
        icon: BookText,
    },
];

function BrandLink({ className, title }: { className?: string; title?: 'short' | 'full' }) {
    return (
        <Link href="/" className={cn('flex items-center gap-4', className)}>
            <Image src="/solana.svg" alt="Solana" width={24} height={21} className="shrink-0" priority />
            {title === 'short' && (
                <span className="whitespace-nowrap text-lg font-bold tracking-tight text-foreground">
                    Validator Governance
                </span>
            )}
            {title === 'full' && (
                <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight text-foreground lg:inline">
                    Solana Validator Governance
                </span>
            )}
        </Link>
    );
}

function NavLinkItem({
    href,
    label,
    icon: Icon,
    pathname,
    className,
    showIcon = false,
}: NavLink & { pathname: string; className?: string; showIcon?: boolean }) {
    const isLocal = href.startsWith('/');
    const isActive = isLocal && pathname.startsWith(href);

    return (
        <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
            {showIcon && <Icon aria-hidden className="size-5 shrink-0" />}
            {label}
        </Link>
    );
}

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/70 backdrop-blur-md">
            <div className="mx-auto px-4 sm:px-8">
                <div className="relative flex h-20 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Open navigation menu"
                                        className="rounded-full bg-transparent text-muted-foreground lg:hidden"
                                    >
                                        <Menu className="size-5" />
                                    </Button>
                                }
                            />
                            <SheetContent
                                side="left"
                                showCloseButton={false}
                                className="w-72 gap-0 border-r border-border bg-background p-0 sm:max-w-72"
                            >
                                <SheetHeader className="border-b border-border p-4">
                                    <SheetTitle>
                                        <BrandLink title="short" />
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">Navigation menu</SheetDescription>
                                </SheetHeader>

                                <nav className="flex flex-col gap-2 p-4">
                                    {navLinks.map(link => {
                                        const isActive = link.href.startsWith('/') && pathname.startsWith(link.href);

                                        return (
                                            <NavLinkItem
                                                key={link.href}
                                                {...link}
                                                pathname={pathname}
                                                showIcon
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all',
                                                    isActive
                                                        ? 'bg-muted text-foreground'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                )}
                                            />
                                        );
                                    })}
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <BrandLink title="full" />
                    </div>

                    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
                        <ul className="flex list-none items-center gap-8">
                            {navLinks.map(link => (
                                <li key={link.href}>
                                    <NavLinkItem
                                        {...link}
                                        pathname={pathname}
                                        className={cn(
                                            'text-sm font-medium transition-colors',
                                            link.href.startsWith('/') && pathname.startsWith(link.href)
                                                ? 'text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex items-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
