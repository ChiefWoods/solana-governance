'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { VOTE_OPTIONS, type VoteDistribution, type VoteOption } from '@/lib/voteDistribution';

const OPTION_CLASS: Record<VoteOption, { selected: string; thumb: string; track: string }> = {
    abstain: {
        selected: 'bg-muted text-foreground',
        thumb: '[&_[data-slot=slider-thumb]]:border-muted-foreground',
        track: '[&_[data-slot=slider-range]]:bg-muted-foreground/70',
    },
    against: {
        selected: 'bg-dao-status-failed/20 text-dao-status-failed',
        thumb: '[&_[data-slot=slider-thumb]]:border-dao-status-failed',
        track: '[&_[data-slot=slider-range]]:bg-dao-status-failed',
    },
    for: {
        selected: 'bg-dao-status-finalized/20 text-dao-status-finalized',
        thumb: '[&_[data-slot=slider-thumb]]:border-dao-status-finalized',
        track: '[&_[data-slot=slider-range]]:bg-dao-status-finalized',
    },
};

const QUICK_LABEL: Record<VoteOption, string> = {
    abstain: '100% Abstain',
    against: '100% Against',
    for: '100% For',
};

const OPTION_LABEL: Record<VoteOption, string> = {
    abstain: 'Abstain',
    against: 'Against',
    for: 'For',
};

export function VoteDistributionControls({
    distribution,
    handleOptionChange,
    handleQuickSelect,
    isValidDistribution,
    totalPercentage,
    error,
}: {
    distribution: VoteDistribution;
    error?: string;
    handleOptionChange: (option: VoteOption, value: number) => void;
    handleQuickSelect: (option: VoteOption) => void;
    isValidDistribution: boolean;
    totalPercentage: number;
}) {
    return (
        <div className="space-y-5">
            <Field>
                <FieldLabel>Quick Vote Options</FieldLabel>
                <ButtonGroup className="w-full">
                    {VOTE_OPTIONS.map(option => (
                        <Button
                            key={option}
                            type="button"
                            variant="outline"
                            className={cn(
                                'h-9 flex-1',
                                distribution[option] === 100 ? OPTION_CLASS[option].selected : 'text-muted-foreground',
                            )}
                            onClick={() => handleQuickSelect(option)}
                        >
                            {QUICK_LABEL[option]}
                        </Button>
                    ))}
                </ButtonGroup>
            </Field>

            <Field data-invalid={Boolean(error)}>
                <FieldLabel>New Vote Distribution</FieldLabel>
                <div className="space-y-4">
                    {VOTE_OPTIONS.map(option => (
                        <div key={option} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{OPTION_LABEL[option]}</span>
                                <span className="tabular-nums">{distribution[option]}%</span>
                            </div>
                            <Slider
                                aria-label={OPTION_LABEL[option]}
                                className={cn(OPTION_CLASS[option].thumb, OPTION_CLASS[option].track)}
                                max={100}
                                min={0}
                                step={1}
                                value={[distribution[option]]}
                                onValueChange={value => {
                                    const next = Array.isArray(value) ? value[0] : value;
                                    handleOptionChange(option, next ?? 0);
                                }}
                            />
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 text-sm">
                        <span className="font-medium">Total</span>
                        <span
                            className={cn(
                                'font-medium tabular-nums',
                                isValidDistribution ? 'text-foreground' : 'text-destructive',
                            )}
                        >
                            {totalPercentage}%
                        </span>
                    </div>
                    {error && <FieldError>{error}</FieldError>}
                </div>
            </Field>
        </div>
    );
}
