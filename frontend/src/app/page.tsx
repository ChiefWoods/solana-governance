import { Faq } from '@/components/Faq';
import { ProposalsTable } from '@/components/proposals/ProposalsTable';

export default function Page() {
    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-8 sm:px-8">
            <ProposalsTable />
            <Faq />
        </main>
    );
}
