import type { IdlAccounts, Program } from "@coral-xyz/anchor";

import { Svmgov } from "./svmgov";

export type SvmgovProgramType = Program<Svmgov>;

export type ProposalAccount = IdlAccounts<Svmgov>["proposal"];
export type VoteAccount = IdlAccounts<Svmgov>["vote"];
export type VoteOverrideAccount = IdlAccounts<Svmgov>["voteOverride"];
export type SupportAccount = IdlAccounts<Svmgov>["support"];
export type GlobalConfigAccount = IdlAccounts<Svmgov>["globalConfig"];
