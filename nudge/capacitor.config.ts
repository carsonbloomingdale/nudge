import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nudge.app",
  appName: "nudge",
  webDir: "build",
  server: {
    androidScheme: "https",
  },
  // "always" stacks with CSS env(safe-area-inset-*) and makes the sticky header look too tall at scroll top.
  ios: {
    contentInset: "never",
  },
  // Native XHR/fetch — avoids WKWebView CORS (Eruda “status 0” on API calls).
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
