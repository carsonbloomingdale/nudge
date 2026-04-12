import { beforeEach, describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderPage, renderWithAuth } from "../../src/test/pageTestUtils";
import LoginPage from "../../src/pages/LoginPage";
import SignupPage from "../../src/pages/SignupPage";
import MagicLinkPage from "../../src/pages/MagicLinkPage";
import TermsPage from "../../src/pages/TermsPage";
import NudgeHomePage from "../../src/pages/NudgeHomePage";
import IdentityMapPage from "../../src/pages/IdentityMapPage";
import TraitGrowthPage from "../../src/pages/TraitGrowthPage";
import GoalsPage from "../../src/pages/GoalsPage";
import FinancesPage from "../../src/pages/FinancesPage";
import SupportTicketsPage from "../../src/pages/SupportTicketsPage";
import AdminInsufficientPage from "../../src/pages/AdminInsufficientPage";
import AdminSupportQueuePage from "../../src/pages/AdminSupportQueuePage";
import AdminCustomersPage from "../../src/pages/AdminCustomersPage";
import AccountPage from "../../src/pages/AccountPage";
import SettingsPage from "../../src/pages/SettingsPage";
import JournalReminderPage from "../../src/pages/JournalReminderPage";
import InsightsPage from "../../src/pages/InsightsPage";

beforeEach(() => {
  localStorage.clear();
});

describe("page smoke (mount + headline)", () => {
  test("LoginPage", async () => {
    renderWithAuth(<LoginPage />, { initialEntry: "/auth/login" });
    expect(
      await screen.findByRole("heading", { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  test("SignupPage", async () => {
    renderWithAuth(<SignupPage />, { initialEntry: "/auth/signup" });
    expect(
      await screen.findByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  test("MagicLinkPage", async () => {
    renderWithAuth(<MagicLinkPage />, { initialEntry: "/auth/magic" });
    expect(
      await screen.findByRole("heading", { name: /magic link/i }),
    ).toBeInTheDocument();
  });

  test("TermsPage", async () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: /terms & conditions/i }),
    ).toBeInTheDocument();
  });

  test("NudgeHomePage", async () => {
    renderPage(<NudgeHomePage />);
    expect(
      await screen.findByText(/welcome back/i, {}, { timeout: 8000 }),
    ).toBeInTheDocument();
  });

  test("IdentityMapPage", async () => {
    renderPage(<IdentityMapPage />);
    expect(
      await screen.findByRole("heading", { name: /your identity map/i }),
    ).toBeInTheDocument();
  });

  test("TraitGrowthPage", async () => {
    renderPage(<TraitGrowthPage />);
    expect(
      await screen.findByRole("heading", { name: /trait growth/i }),
    ).toBeInTheDocument();
  });

  test("GoalsPage", async () => {
    renderPage(<GoalsPage />);
    const headings = await screen.findAllByRole("heading", {
      name: /growth goals/i,
    });
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0]).toBeInTheDocument();
  });

  test("FinancesPage", async () => {
    renderPage(<FinancesPage />);
    expect(
      await screen.findByRole("heading", { name: /^finances$/i }),
    ).toBeInTheDocument();
  });

  test("SupportTicketsPage", async () => {
    renderPage(<SupportTicketsPage />);
    expect(
      await screen.findByRole("heading", { name: /^support$/i }),
    ).toBeInTheDocument();
  });

  test("AdminInsufficientPage", async () => {
    renderPage(<AdminInsufficientPage />);
    expect(
      await screen.findByRole("heading", {
        name: /insufficient permissions/i,
      }),
    ).toBeInTheDocument();
  });

  test("AdminSupportQueuePage", async () => {
    renderPage(<AdminSupportQueuePage />);
    expect(
      await screen.findByRole("heading", { name: /admin support queue/i }),
    ).toBeInTheDocument();
  });

  test("AdminCustomersPage", async () => {
    renderPage(<AdminCustomersPage />);
    expect(
      await screen.findByRole("heading", { name: /admin customers/i }),
    ).toBeInTheDocument();
  });

  test("AccountPage", async () => {
    renderPage(<AccountPage />);
    expect(
      await screen.findByRole("heading", { name: /^profile$/i }),
    ).toBeInTheDocument();
  });

  test("SettingsPage", async () => {
    renderPage(<SettingsPage />);
    expect(
      await screen.findByRole("heading", { name: /^settings$/i }),
    ).toBeInTheDocument();
  });

  test("JournalReminderPage", async () => {
    renderPage(<JournalReminderPage />);
    expect(
      await screen.findByRole("heading", { name: /journal reminder/i }),
    ).toBeInTheDocument();
  });

  test("InsightsPage", async () => {
    renderPage(<InsightsPage />);
    expect(
      await screen.findByRole("heading", { name: /^insights$/i }),
    ).toBeInTheDocument();
  });
});
