'use client';

import { BookText, LayoutDashboard, Menu, Scroll, SettingsIcon, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ConnectButton } from '@/components/connectorkit/ConnectButton';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { env } from '@/env';
import { cn } from '@/lib/utils';

type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
    external?: boolean;
};

const navLinks: NavLink[] = [
    { href: '/proposals', label: 'Proposals', icon: Scroll },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
        href: env.NEXT_PUBLIC_DOCS_URL,
        label: 'Docs',
        icon: BookText,
        external: true,
    },
];

const previewLinks = [
    { href: '/preview', label: 'Proposals' },
    { href: '/proposal/preview', label: 'Proposal' },
    { href: '/dashboard/preview', label: 'Dashboard' },
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

const mobileMenuItemClassName =
    'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground';

function isNavLinkActive(pathname: string, href: string) {
    return href === '/proposals' ? pathname === '/' || pathname.startsWith(href) : pathname.startsWith(href);
}

function NavLinkItem({
    href,
    label,
    icon: Icon,
    external,
    pathname,
    className,
    showIcon = false,
}: NavLink & { pathname: string; className?: string; showIcon?: boolean }) {
    const isActive = !external && isNavLinkActive(pathname, href);
    const content = (
        <>
            {showIcon && <Icon aria-hidden className="size-5 shrink-0" />}
            {label}
        </>
    );

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
            {content}
        </Link>
    );
}

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

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
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Open navigation menu"
                                        className="rounded-full text-muted-foreground lg:hidden"
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
                                        const isActive = !link.external && isNavLinkActive(pathname, link.href);

                                        return (
                                            <NavLinkItem
                                                key={link.href}
                                                {...link}
                                                pathname={pathname}
                                                showIcon
                                                className={cn(
                                                    mobileMenuItemClassName,
                                                    isActive && 'bg-muted text-foreground',
                                                )}
                                            />
                                        );
                                    })}
                                    <Separator />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={cn(
                                            mobileMenuItemClassName,
                                            'h-auto w-full justify-start dark:hover:bg-muted focus-visible:border-transparent focus-visible:ring-0 active:translate-y-0',
                                        )}
                                        onClick={() => {
                                            setIsOpen(false);
                                            setSettingsOpen(true);
                                        }}
                                    >
                                        <SettingsIcon aria-hidden className="size-5 shrink-0" />
                                        Settings
                                    </Button>
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
                                            !link.external && isNavLinkActive(pathname, link.href)
                                                ? 'text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    />
                                </li>
                            ))}
                            <li>
                                <NavigationMenu>
                                    <NavigationMenuList>
                                        <NavigationMenuItem>
                                            <NavigationMenuTrigger>Preview</NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <ul className="grid w-44 gap-1">
                                                    {previewLinks.map(link => (
                                                        <li key={link.href}>
                                                            <NavigationMenuLink
                                                                render={<Link href={link.href} />}
                                                                className="px-3 py-2"
                                                            >
                                                                {link.label}
                                                            </NavigationMenuLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </li>
                        </ul>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Settings"
                            className="hidden cursor-pointer bg-transparent rounded-full text-muted-foreground lg:inline-flex"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <SettingsIcon className="size-4" />
                        </Button>
                        <ConnectButton showNetworkSelector={false} showRecentActivity={false} showTokens={false} />
                    </div>
                </div>
            </div>
            <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        </header>
    );
}
