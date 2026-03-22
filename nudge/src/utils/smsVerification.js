import { isE164Phone } from "./profileFields";

/**
 * Prefer **`phone_verified`** from the API; fall back to **`phone_verified_at`** for older payloads / cache.
 * @param {import("../api/authApi").AuthUser | null | undefined} user
 */
export function isPhoneVerified(user) {
  if (!user) {
    return false;
  }
  if (typeof user.phoneVerified === "boolean") {
    return user.phoneVerified;
  }
  return Boolean(user.phoneVerifiedAt);
}

/**
 * @param {import("../api/authApi").AuthUser | null | undefined} user
 * @returns {boolean}
 */
export function hasSavedSmsPhone(user) {
  return Boolean(user?.phone && isE164Phone(user.phone));
}

/**
 * SMS opted in, saved E.164 present, not yet verified.
 * @param {import("../api/authApi").AuthUser | null | undefined} user
 */
export function needsPhoneVerification(user) {
  if (!user?.smsOptIn) {
    return false;
  }
  if (!hasSavedSmsPhone(user)) {
    return false;
  }
  return !isPhoneVerified(user);
}

/**
 * Ready for test SMS / daily prompts: opted in, verified number on profile.
 * @param {import("../api/authApi").AuthUser | null | undefined} user
 */
export function isSmsFullyEnabled(user) {
  if (!user?.smsOptIn) {
    return false;
  }
  if (!hasSavedSmsPhone(user)) {
    return false;
  }
  return isPhoneVerified(user);
}
