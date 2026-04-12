import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicAuthRoute from "./components/PublicAuthRoute";
import SessionSpinner from "./components/auth/SessionSpinner";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MagicLinkPage from "./pages/MagicLinkPage";
import AppLayout from "./layouts/AppLayout";
import AccountPage from "./pages/AccountPage";
import NudgeHomePage from "./pages/NudgeHomePage";
import SettingsPage from "./pages/SettingsPage";
import JournalReminderPage from "./pages/JournalReminderPage";
import IdentityMapPage from "./pages/IdentityMapPage";
import TraitGrowthPage from "./pages/TraitGrowthPage";
import GoalsPage from "./pages/GoalsPage";
import TermsPage from "./pages/TermsPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import AdminSupportQueuePage from "./pages/AdminSupportQueuePage";
import AdminCustomersPage from "./pages/AdminCustomersPage";
import AdminInsufficientPage from "./pages/AdminInsufficientPage";
import AdminRoute from "./components/AdminRoute";
import SectionErrorBoundary from "./components/errors/SectionErrorBoundary";
import { initUiAccentFromStorage } from "./theme/uiAccent";
import { refreshJournalReminderSchedule } from "./mobile/journalReminder";
import { setupNativePushNotifications } from "./mobile/pushNotifications";

function RootRedirect() {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) {
    return <SessionSpinner />;
  }
  return (
    <Navigate to={isAuthenticated ? "/app" : "/auth/login"} replace />
  );
}

function AppRoutes() {
  const withBoundary = (section, element, opts = {}) => (
    <SectionErrorBoundary section={section} showSendSupport={opts.showSendSupport}>
      {element}
    </SectionErrorBoundary>
  );

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/auth/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <PublicAuthRoute>
            <SignupPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/auth/magic"
        element={
          <PublicAuthRoute>
            <MagicLinkPage />
          </PublicAuthRoute>
        }
      />
      <Route path="/terms" element={<TermsPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={withBoundary("Home", <NudgeHomePage />)} />
        <Route path="identity" element={withBoundary("Identity", <IdentityMapPage />)} />
        <Route path="traits" element={withBoundary("Traits", <TraitGrowthPage />)} />
        <Route path="insights" element={<Navigate to="/app/identity" replace />} />
        <Route path="goals" element={withBoundary("Goals", <GoalsPage />)} />
        <Route
          path="support"
          element={withBoundary("Support", <SupportTicketsPage />, { showSendSupport: false })}
        />
        <Route
          path="admin/insufficient"
          element={withBoundary("Admin insufficient", <AdminInsufficientPage />)}
        />
        <Route
          path="admin/tickets"
          element={(
            <AdminRoute>{withBoundary("Admin tickets", <AdminSupportQueuePage />)}</AdminRoute>
          )}
        />
        <Route
          path="admin/customers"
          element={(
            <AdminRoute>{withBoundary("Admin customers", <AdminCustomersPage />)}</AdminRoute>
          )}
        />
        <Route path="account" element={withBoundary("Account", <AccountPage />)} />
        <Route path="settings" element={withBoundary("Settings", <SettingsPage />)} />
        <Route
          path="reminders"
          element={withBoundary("Reminders", <JournalReminderPage />)}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    initUiAccentFromStorage();
    void setupNativePushNotifications();
    void refreshJournalReminderSchedule();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
