import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { AppShellProvider } from "../context/AppShellContext";

/**
 * Router + auth + app shell (typical /app child pages).
 * @param {React.ReactElement} element — page component
 * @param {{ initialEntry?: string }} [options]
 */
export function renderPage(element, { initialEntry = "/app" } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppShellProvider>
          <Routes>
            <Route path="*" element={element} />
          </Routes>
        </AppShellProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/**
 * Router + auth only (auth routes, or pages that do not need the shell).
 */
export function renderWithAuth(element, { initialEntry = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}
