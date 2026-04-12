/**
 * API + native stubs for Bun component tests (preload before app imports).
 * Paths are relative to this file (`src/test/`).
 */
import { mock } from "bun:test";

const testUser = {
  userId: "u1",
  id: "u1",
  username: "testuser",
  email: "test@example.com",
  role: "admin",
  firstName: "Test",
  lastName: "User",
};

const json = (data: unknown) => Promise.resolve({ data });

mock.module("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => "web",
  },
}));

mock.module("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: "granted" }),
    requestPermissions: async () => ({ display: "granted" }),
    schedule: async () => {},
    cancel: async () => {},
    getPending: async () => ({ notifications: [] }),
    createChannel: async () => {},
  },
}));

mock.module("../api/httpClient", () => ({
  __esModule: true,
  default: {
    get: (url: string) => {
      const u = String(url);
      if (u.includes("/tasks") || u.includes("tasks/")) return json([]);
      if (u.includes("journals")) return json({ journals: [] });
      return json({});
    },
    post: () => json({}),
    patch: () => json({}),
    delete: () => json({}),
    interceptors: {
      request: { use: () => {}, eject: () => {} },
      response: { use: () => {}, eject: () => {} },
    },
  },
}));

mock.module("../api/authApi", () => ({
  refreshSession: () => Promise.resolve(),
  fetchCurrentUserResilient: () =>
    Promise.resolve({ user: testUser, error: null }),
  fetchCurrentUser: () => Promise.resolve(testUser),
  logoutApi: () => Promise.resolve(),
  normalizeUserPayload: (data: Record<string, unknown> | null | undefined) => {
    if (!data || typeof data !== "object") return null;
    const userId = data.id ?? data.user_id ?? data.uuid ?? data.sub;
    if (userId == null || userId === "") return null;
    return { ...data, userId: String(userId), id: String(userId) };
  },
  mergeAuthMeData: (
    prev: Record<string, unknown> | null | undefined,
    data: Record<string, unknown> | null | undefined,
  ) => {
    if (!data || typeof data !== "object") return prev ?? null;
    return { ...(prev ?? {}), ...data };
  },
  login: () => {},
  register: () => {},
  patchCurrentUser: () => Promise.resolve({ data: {} }),
  messageFromAuthError: () => "Something went wrong.",
  postSendPhoneVerificationCode: () => Promise.resolve(),
  postVerifyPhoneCode: () => Promise.resolve(),
  postSmsTest: () => Promise.resolve(),
}));

mock.module("../api/fetchTaskData", () => ({
  __esModule: true,
  default: () => Promise.resolve([]),
  insightSnapshotsFromEnriched: () => [],
  regenerateJournalInsights: () => Promise.resolve(),
}));

mock.module("../api/fetchSuggestion", () => ({
  __esModule: true,
  default: () => Promise.resolve(null),
}));

mock.module("../api/uploadJournalAttachments", () => ({
  uploadJournalAttachments: () => Promise.resolve(),
}));

mock.module("../api/analyticsApi", () => ({
  fetchPersonalityTraitsChart: () =>
    Promise.resolve({
      segments: [],
      total_associations: 0,
      chart_mode: "raw_only",
    }),
  fetchPinnedTraits: () => Promise.resolve([]),
  pinTrait: () => Promise.resolve(null),
  unpinTrait: () => Promise.resolve([]),
  replacePinnedTraits: () => Promise.resolve([]),
  fetchGrowthGoalSuggestions: () => Promise.resolve([]),
  fetchPinnedGrowthGoals: () => Promise.resolve([]),
  pinGrowthGoal: () => Promise.resolve(null),
  unpinGrowthGoal: () => Promise.resolve([]),
  fetchGrowthGoalsActivityTotals: () => Promise.resolve([]),
  fetchGrowthGoalActivity: () => Promise.resolve([]),
  fetchTraitsActivityTotals: () => Promise.resolve([]),
  fetchTraitActivity: () => Promise.resolve([]),
}));

mock.module("../api/financeApi", () => ({
  listFinanceTransactions: () => Promise.resolve([]),
  listFinanceBudgets: () => Promise.resolve([]),
  fetchFinancePieAnalytics: () => Promise.resolve({ categories: [] }),
  fetchFinanceBudgetUtilization: () => Promise.resolve([]),
  createFinanceTransaction: () => Promise.resolve(),
  patchFinanceTransaction: () => Promise.resolve(),
  deleteFinanceTransaction: () => Promise.resolve(),
  importFinanceTransactions: () => Promise.resolve(),
  createFinanceCategorizationJob: () => Promise.resolve(),
  getFinanceCategorizationJob: () => Promise.resolve(null),
  createFinanceBudget: () => Promise.resolve(),
  patchFinanceBudget: () => Promise.resolve(),
  deleteFinanceBudget: () => Promise.resolve(),
}));

mock.module("../api/supportApi", () => ({
  listOwnSupportTickets: () => Promise.resolve([]),
  createSupportTicket: () => Promise.resolve({ ticket: null }),
  getOwnSupportTicket: () => Promise.resolve(null),
  createOwnSupportTicketMessage: () => Promise.resolve(),
}));

mock.module("../api/adminApi", () => ({
  listAdminSupportTickets: () => Promise.resolve([]),
  getAdminSupportTicket: () => Promise.resolve(null),
  patchAdminSupportTicket: () => Promise.resolve(),
  assignAdminSupportTicket: () => Promise.resolve(),
  postAdminSupportTicketMessage: () => Promise.resolve(),
  listAdminCustomers: () => Promise.resolve([]),
  getAdminCustomer: () => Promise.resolve(null),
  patchAdminCustomerActions: () => Promise.resolve(),
}));

mock.module("../api/adminMfa", () => ({
  writeAdminMfaCode: () => {},
}));

function isAxiosError(e: unknown) {
  return Boolean(
    e &&
      typeof e === "object" &&
      "isAxiosError" in e &&
      (e as { isAxiosError?: boolean }).isAxiosError,
  );
}

const axiosStub = {
  get: () => Promise.resolve({ data: {} }),
  post: () => Promise.resolve({ data: {} }),
  patch: () => Promise.resolve({ data: {} }),
  create: () => ({
    get: () => Promise.resolve({ data: {} }),
    post: () => Promise.resolve({ data: {} }),
    interceptors: {
      request: { use: () => {}, eject: () => {} },
      response: { use: () => {}, eject: () => {} },
    },
  }),
  isAxiosError,
};

mock.module("axios", () => ({
  __esModule: true,
  default: axiosStub,
  ...axiosStub,
}));
