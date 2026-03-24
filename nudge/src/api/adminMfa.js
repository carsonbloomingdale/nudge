const ADMIN_MFA_CODE_KEY = "nudge_admin_mfa_code";

export function readAdminMfaCode() {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return String(sessionStorage.getItem(ADMIN_MFA_CODE_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function writeAdminMfaCode(code) {
  if (typeof window === "undefined") {
    return;
  }
  const next = String(code ?? "").trim();
  try {
    if (!next) {
      sessionStorage.removeItem(ADMIN_MFA_CODE_KEY);
      return;
    }
    sessionStorage.setItem(ADMIN_MFA_CODE_KEY, next);
  } catch {
    // Ignore storage errors.
  }
}

export function buildAdminMfaHeaders() {
  const code = readAdminMfaCode();
  if (!code) {
    return {};
  }
  return { "x-admin-mfa-code": code };
}
