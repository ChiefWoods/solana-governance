import Image from 'next/image';

import { Separator } from '@/components/ui/separator';

const socialLinks = [
    {
        href: 'https://github.com/solana-foundation/solana-governance-proposals',
        label: 'Solana Governance Proposals on GitHub',
        src: '/github.svg',
    },
    {
        href: 'https://x.com/solana',
        label: 'Solana on X',
        src: '/x.svg',
    },
    {
        href: 'https://discord.gg/solana',
        label: 'Solana tech discord',
        src: '/discord.svg',
    },
] as const;

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="flex w-full shrink-0 flex-col items-start gap-4 px-10 py-6">
            <div className="flex w-full items-center justify-center gap-6">
                {socialLinks.map(({ href, label, src }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="flex size-6 items-center justify-center opacity-50 transition-opacity duration-200 hover:opacity-100"
                    >
                        <Image src={src} alt="" width={16} height={16} className="invert" />
                    </a>
                ))}
            </div>

            <div className="flex h-4 w-full items-center justify-center gap-4 text-xs font-normal text-muted-foreground">
                <span>© {currentYear} Solana</span>
                <Separator orientation="vertical" />
                <a
                    href="https://solana.com/tos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-200 hover:text-white"
                >
                    Terms
                </a>
                <Separator orientation="vertical" />
                <a
                    href="https://solana.com/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-200 hover:text-white"
                >
                    Privacy Policy
                </a>
            </div>
        </footer>
    );
}
