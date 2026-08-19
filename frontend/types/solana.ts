import type { GetEpochInfoApi, GetEpochScheduleApi, GetVoteAccountsApi } from '@solana/kit';

export type EpochInfo = ReturnType<GetEpochInfoApi['getEpochInfo']>;
export type EpochSchedule = ReturnType<GetEpochScheduleApi['getEpochSchedule']>;
export type VoteAccount = ReturnType<GetVoteAccountsApi['getVoteAccounts']>;
