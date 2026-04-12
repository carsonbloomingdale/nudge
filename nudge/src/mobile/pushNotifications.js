import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import http from "../api/httpClient";

let didSetup = false;

function wantsNativePush() {
  return process.env.REACT_APP_ENABLE_NATIVE_PUSH === "true";
}

async function registerDeviceToken(token, platform) {
  const path =
    process.env.REACT_APP_PUSH_REGISTER_PATH || "/api/push/device-token";
  await http.post(path, {
    token,
    platform,
    provider: "apns",
  });
}

export async function setupNativePushNotifications() {
  if (didSetup) {
    return;
  }
  if (!Capacitor.isNativePlatform() || !wantsNativePush()) {
    return;
  }
  didSetup = true;

  PushNotifications.addListener("registration", async (token) => {
    try {
      await registerDeviceToken(token?.value, Capacitor.getPlatform());
    } catch {
      // Keep app UX resilient if push registration endpoint is unavailable.
    }
  });

  PushNotifications.addListener("registrationError", () => {
    // Optional: route to local telemetry in the future.
  });

  PushNotifications.addListener("pushNotificationReceived", () => {
    // Optional: show in-app toast/badge.
  });

  PushNotifications.addListener("pushNotificationActionPerformed", () => {
    // Optional: deep-link from push tap.
  });

  const permissionStatus = await PushNotifications.checkPermissions();
  let receive = permissionStatus.receive;
  if (receive === "prompt") {
    const request = await PushNotifications.requestPermissions();
    receive = request.receive;
  }
  if (receive !== "granted") {
    return;
  }
  await PushNotifications.register();
}
