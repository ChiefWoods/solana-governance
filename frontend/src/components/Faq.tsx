'use client';

import type { ReactNode } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import { env } from '@/env';
import { SGP_REPO_URL, SIMD_REPO_URL } from '@/lib/constants';
import {
    epochConstantsFromGlobalConfig,
    supportThresholdPercentFromConfig,
    type EpochConstants,
} from '@/lib/proposals';

const SGP_DISCUSSIONS_URL = `${SGP_REPO_URL}/discussions`;
const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_MIN_PROPOSAL_STAKE_SOL = 100_000;
const DEFAULT_EPOCHS: EpochConstants = {
    DISCUSSION_EPOCHS: 7n,
    SNAPSHOT_EPOCHS: 1n,
    SUPPORT_EPOCHS: 7n,
    VOTING_EPOCHS: 3n,
};

function FaqLink({ children, href }: { children: ReactNode; href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}

function formatEpochCount(count: bigint): string {
    return `${count} ${count === 1n ? 'epoch' : 'epochs'}`;
}

function formatStakeSol(lamports: bigint | number | undefined): string {
    const sol = lamports === undefined ? DEFAULT_MIN_PROPOSAL_STAKE_SOL : Number(lamports) / LAMPORTS_PER_SOL;
    return sol.toLocaleString('en-US');
}

function faqEntries({
    epochs,
    minStakeSol,
    supportPercent,
}: {
    epochs: EpochConstants;
    minStakeSol: string;
    supportPercent: number;
}): { answer: ReactNode; question: string }[] {
    return [
        {
            question: 'What is an SGP?',
            answer: (
                <>
                    A <strong>Solana Governance Proposal (SGP)</strong> is a stake-weighted, on-chain{' '}
                    <em>signaling vote</em>. It captures a directional decision rather than a detailed technical
                    specification. A &quot;yes&quot; outcome is a mandate to proceed; the implementation that follows is
                    normally specified in one or more SIMDs. Proposals live in the{' '}
                    <FaqLink href={SGP_REPO_URL}>SGP repository on GitHub</FaqLink>.
                </>
            ),
        },
        {
            question: 'How is an SGP different from a SIMD?',
            answer: (
                <>
                    They answer different questions. An SGP answers <em>&quot;should we do this?&quot;</em> and gauges
                    community support. SGPs are decided by a stake-weighted vote of validators and stakers. A{' '}
                    <FaqLink href={SIMD_REPO_URL}>SIMD</FaqLink> answers <em>&quot;how exactly do we do this?&quot;</em>
                    . A SIMD is a detailed protocol specification reviewed by core developers. SIMDs pass optimistically
                    and are not voted on, unless enough stake demands a vote (see below).
                </>
            ),
        },
        {
            question: 'When does a vote happen?',
            answer: (
                <>
                    A vote occurs when the validator set asks for one. An SGP vote is triggered when{' '}
                    <strong>{supportPercent}% of active stake</strong> supports holding it. If less than{' '}
                    {supportPercent}% of stake signals support within the support window, no vote occurs. This keeps
                    voting reserved for systemic decisions with genuine community interest.
                </>
            ),
        },
        {
            question: 'What are the phases, and how long do they take?',
            answer: (
                <>
                    <p>
                        Once a proposal is created on-chain, it moves through fixed, program-enforced phases (one epoch
                        is roughly two days):
                    </p>
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>
                            <strong>Support</strong> — up to {formatEpochCount(epochs.SUPPORT_EPOCHS)} for validators
                            representing {supportPercent}% of stake to sponsor the proposal. If the threshold is not met
                            in time, the proposal expires. During the support phase, if at least {supportPercent}% of
                            stake supports a proposal, then the discussion phase begins in the following epoch.
                        </li>
                        <li>
                            <strong>Discussion</strong> — {formatEpochCount(epochs.DISCUSSION_EPOCHS)}. The proposal
                            text is frozen at a specific GitHub commit; the community studies it.
                        </li>
                        <li>
                            <strong>Snapshot</strong> — {formatEpochCount(epochs.SNAPSHOT_EPOCHS)}. The Node Consensus
                            Network (NCN) fixes the stake distribution used to weight votes.
                        </li>
                        <li>
                            <strong>Voting</strong> — {formatEpochCount(epochs.VOTING_EPOCHS)}. Validators and stakers
                            cast stake-weighted votes: For, Against, or Abstain.
                        </li>
                    </ul>
                    <p>
                        A proposal that reaches the support threshold early advances early — the discussion clock starts
                        when support succeeds, not when the support window would have ended.
                    </p>
                </>
            ),
        },
        {
            question: 'Who can create a proposal?',
            answer: (
                <>
                    Anyone can author a draft SGP as a pull request in the{' '}
                    <FaqLink href={SGP_REPO_URL}>SGP repository</FaqLink>. Creating the on-chain proposal must be done
                    by a validator with at least <strong>{minStakeSol} SOL of active stake</strong>. The minimum stake
                    required for proposals prevents spam.
                </>
            ),
        },
        {
            question: 'How is the vote weighted?',
            answer: (
                <>
                    By active stake, at the snapshot taken before voting opens. Each vote is verified on-chain against a
                    Merkle proof of that snapshot. Validators can cast their full stake on one option or split it across
                    options in basis points.
                </>
            ),
        },
        {
            question: 'Do stakers have the ability to vote?',
            answer: (
                <>
                    Yes. By default your stake votes with your validator, but you have <strong>vote sovereignty</strong>
                    : you can cast an override vote with your own stake account before, after, or in the absence of your
                    validator&apos;s vote. A staker can override the validator&apos;s vote for the portion of stake they
                    delegate to the validator.
                </>
            ),
        },
        {
            question: 'What does it take for a vote to pass?',
            answer: (
                <>
                    Per the <FaqLink href={SGP_REPO_URL}>SGP repository</FaqLink> voting policy: there is{' '}
                    <strong>no quorum</strong> — turnout is not required. A proposal is accepted when{' '}
                    <strong>For is at least two-thirds (66.67%) of For + Against stake</strong>. Abstain is excluded
                    from that calculation. A vote that does not reach the supermajority by the end of the voting period
                    is <em>Rejected</em>.
                </>
            ),
        },
        {
            question: 'Where do I discuss proposals?',
            answer: (
                <>
                    The canonical venue is GitHub. Discussions should occur on each proposal&apos;s pull request and the
                    repository&apos;s <FaqLink href={SGP_DISCUSSIONS_URL}>Discussions</FaqLink> in the{' '}
                    <FaqLink href={SGP_REPO_URL}>SGP repository</FaqLink>. Conversation on other platforms is welcome as
                    advisory input, but GitHub is where deliberation formally happens.
                </>
            ),
        },
        {
            question: 'Where can I learn how the on-chain system works?',
            answer: (
                <>
                    The <FaqLink href={env.NEXT_PUBLIC_DOCS_URL}>technical documentation</FaqLink> covers the on-chain
                    programs, the NCN snapshot process, CLI usage for validators and stakers, and program reference
                    material.
                </>
            ),
        },
    ];
}

export function Faq() {
    const { data } = useGlobalConfig();
    const supportPercent = supportThresholdPercentFromConfig(data?.clusterSupportPctMinBps);
    const epochs = data ? epochConstantsFromGlobalConfig(data) : DEFAULT_EPOCHS;
    const entries = faqEntries({
        epochs,
        minStakeSol: formatStakeSol(data?.minProposalStakeLamports),
        supportPercent,
    });

    return (
        <section id="faq" className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">FAQ</h2>

            <Accordion className="rounded-2xl border border-border bg-card/40 px-6">
                {entries.map(({ answer, question }) => (
                    <AccordionItem key={question} value={question}>
                        <AccordionTrigger className="cursor-pointer py-4 text-base">{question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">{answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
