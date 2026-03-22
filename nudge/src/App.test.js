import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./api/authApi", () => {
  const actual = jest.requireActual("./api/authApi");
  return {
    ...actual,
    refreshSession: jest.fn(() =>
      Promise.reject(
        Object.assign(new Error("401"), {
          response: { status: 401 },
          isAxiosError: true,
        }),
      ),
    ),
  };
});

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
