/** Avoids importing AuthContext from httpClient (circular deps). */
let onSessionExpired = null;

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

export function notifySessionExpired() {
  try {
    onSessionExpired?.();
  } catch {
    /* ignore */
  }
}
