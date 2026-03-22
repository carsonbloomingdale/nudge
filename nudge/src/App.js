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
import InsightsPage from "./pages/InsightsPage";
import GoalsPage from "./pages/GoalsPage";

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
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NudgeHomePage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
