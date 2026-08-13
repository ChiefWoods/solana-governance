import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { OverrideVoteModal } from "../OverrideVoteModal";
import { WalletRole } from "@/types";

const {
  mockMutate,
  mockUseChainVoteAccount,
  mockUseWalletRole,
  mockUseWalletStakeAccounts,
  mockUseVoteOverrideAccounts,
  mockHandleOptionChange,
  mockHandleQuickSelect,
  mockResetDistribution,
} = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseChainVoteAccount: vi.fn(),
  mockUseWalletRole: vi.fn(),
  mockUseWalletStakeAccounts: vi.fn(),
  mockUseVoteOverrideAccounts: vi.fn(),
  mockHandleOptionChange: vi.fn(),
  mockHandleQuickSelect: vi.fn(),
  mockResetDistribution: vi.fn(),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useAnchorWallet: vi.fn(),
}));

vi.mock("@/hooks", () => ({
  useCastVoteOverride: vi.fn(() => ({
    mutate: mockMutate,
  })),
  useChainVoteAccount: (...args: unknown[]) => mockUseChainVoteAccount(...args),
  useVoteDistribution: vi.fn(() => ({
    distribution: { for: 100, against: 0, abstain: 0 },
    totalPercentage: 100,
    isValidDistribution: true,
    handleOptionChange: mockHandleOptionChange,
    handleQuickSelect: mockHandleQuickSelect,
    resetDistribution: mockResetDistribution,
  })),
  useVoteOverrideAccounts: (...args: unknown[]) =>
    mockUseVoteOverrideAccounts(...args),
  useWalletRole: (...args: unknown[]) => mockUseWalletRole(...args),
  useWalletStakeAccounts: (...args: unknown[]) =>
    mockUseWalletStakeAccounts(...args),
  VOTE_OPTIONS: ["for", "against", "abstain"],
}));

vi.mock("../../StakeAccountsDropdown", () => ({
  StakeAccountsDropdown: ({
    onValueChange,
  }: {
    onValueChange: (value: string) => void;
  }) => {
    React.useEffect(() => {
      onValueChange("stake-account");
    }, [onValueChange]);

    return <div>Stake account: stake-account</div>;
  },
}));

vi.mock("../../VotingProposalsDropdown", () => ({
  VotingProposalsDropdown: () => <div>Proposal: proposal-id</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("OverrideVoteModal", () => {
  const wallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    proposalId: "proposal-id",
    consensusResult: new PublicKey("11111111111111111111111111111111"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAnchorWallet).mockReturnValue(wallet);
    mockUseWalletRole.mockReturnValue({ walletRole: WalletRole.STAKER });
    mockUseWalletStakeAccounts.mockReturnValue({
      data: [
        {
          activeStake: 1_000,
          stakeAccount: "stake-account",
          voteAccount: "vote-account",
        },
      ],
    });
    mockUseVoteOverrideAccounts.mockReturnValue({ data: [] });
    mockUseChainVoteAccount.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it("allows normal staker override votes without validator confirmation", async () => {
    render(<OverrideVoteModal {...defaultProps} />);

    expect(screen.getByText("Stake override")).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", {
        name: /submit stake override instead of validator vote/i,
      })
    ).not.toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: "Cast Vote" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        stakeAccount: "stake-account",
      }),
      expect.any(Object)
    );
    // The validator vote account is no longer derived from the live on-chain delegation in the
    // modal — castVoteOverride resolves it from the stake proof's snapshot delegation instead.
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ voteAccount: expect.anything() }),
      expect.any(Object)
    );
  });

  it("requires explicit confirmation before a validator-identity wallet can submit an override vote", async () => {
    mockUseChainVoteAccount.mockReturnValue({
      data: {
        activeStake: 1_000,
        nodePubkey: wallet.publicKey.toBase58(),
        voteAccount: "validator-vote-account",
      },
      isLoading: false,
    });

    render(<OverrideVoteModal {...defaultProps} />);

    const confirmation = screen.getByRole("checkbox", {
      name: /submit stake override instead of validator vote/i,
    });
    const submitButton = screen.getByRole("button", { name: "Cast Vote" });

    expect(confirmation).not.toBeChecked();
    expect(submitButton).toBeDisabled();

    fireEvent.click(confirmation);

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        stakeAccount: "stake-account",
      }),
      expect.any(Object)
    );
    // The validator vote account is no longer derived from the live on-chain delegation in the
    // modal — castVoteOverride resolves it from the stake proof's snapshot delegation instead.
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ voteAccount: expect.anything() }),
      expect.any(Object)
    );
  });
});
