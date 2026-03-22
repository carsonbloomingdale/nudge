import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./api/httpClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

jest.mock("./api/authApi", () => ({
  refreshSession: jest.fn(() =>
    Promise.reject(
      Object.assign(new Error("401"), {
        response: { status: 401 },
        isAxiosError: true,
      }),
    ),
  ),
  fetchCurrentUser: jest.fn(),
  fetchCurrentUserResilient: jest.fn(() =>
    Promise.resolve({ user: null, error: null }),
  ),
  logoutApi: jest.fn(() => Promise.resolve()),
  normalizeUserPayload: jest.fn(() => null),
  login: jest.fn(),
  register: jest.fn(),
  patchCurrentUser: jest.fn(),
  messageFromAuthError: jest.fn(() => "Something went wrong."),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("shows sign-in after bootstrap when logged out", async () => {
  render(<App />);
  expect(
    await screen.findByPlaceholderText(/username or email/i),
  ).toBeInTheDocument();
});
