// TODO: to be changed with SIMD-0525
const SLOT_TIME_MS = 400;

export type EpochTiming = {
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
};

export function estimateMsUntilEpochStart(targetEpoch: bigint, timing: EpochTiming): number {
    const remainingSlots = (targetEpoch - timing.epoch) * timing.slotsInEpoch - timing.slotIndex;
    return Number(remainingSlots * BigInt(SLOT_TIME_MS));
}

export function formatDuration(ms: number): string | null {
    if (ms <= 0) return null;

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
}

export function formatTimeRemaining(ms: number, pastLabel = 'Ended'): string {
    const duration = formatDuration(ms);
    return duration ? `${duration} left` : pastLabel;
}
