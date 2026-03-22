/** E.164: + then country code, 1–15 digits total after + */
const E164_RE = /^\+[1-9]\d{1,14}$/;

export function stripPhoneForSubmit(raw) {
  if (raw == null) {
    return "";
  }
  return String(raw).replace(/[\s().-]/g, "").trim();
}

export function isE164Phone(raw) {
  const s = stripPhoneForSubmit(raw);
  return s.length > 0 && E164_RE.test(s);
}

/**
 * IANA timezone from the browser (e.g. America/Los_Angeles), or null if unavailable.
 */
export function getBrowserTimeZone() {
  try {
    if (typeof Intl === "undefined") {
      return null;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === "string") {
      const t = tz.trim();
      return t || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function listTimeZones() {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* ignore */
  }
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

/** @param {object | null | undefined} user */
export function profileToFormState(user) {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    timezone: user?.timezone ?? "",
    smsOptIn: Boolean(user?.smsOptIn),
  };
}

/**
 * Same as profileToFormState, but when the server has no timezone we prefill from the device.
 */
export function profileToFormStateWithDetectedTimeZone(user) {
  const base = profileToFormState(user);
  if (String(base.timezone).trim()) {
    return base;
  }
  const detected = getBrowserTimeZone();
  return detected ? { ...base, timezone: detected } : base;
}

export function buildRegisterOptionalPayload({
  firstName,
  lastName,
  phone,
  timezone,
  smsOptIn,
}) {
  const payload = {};
  const fn = String(firstName ?? "").trim();
  const ln = String(lastName ?? "").trim();
  const tz = String(timezone ?? "").trim();
  const p = stripPhoneForSubmit(phone);

  if (fn) {
    payload.first_name = fn;
  }
  if (ln) {
    payload.last_name = ln;
  }
  if (p) {
    payload.phone = p;
  }
  if (tz) {
    payload.timezone = tz;
  }
  if (smsOptIn) {
    payload.sms_opt_in = true;
  }
  return payload;
}

/**
 * PATCH /auth/me body (snake_case). Empty phone → null to clear on server.
 */
export function buildProfilePatchPayload({
  firstName,
  lastName,
  phone,
  timezone,
  smsOptIn,
}) {
  const fn = String(firstName ?? "").trim();
  const ln = String(lastName ?? "").trim();
  const tz = String(timezone ?? "").trim();
  const p = stripPhoneForSubmit(phone);

  return {
    first_name: fn || null,
    last_name: ln || null,
    phone: p ? p : null,
    timezone: tz || null,
    sms_opt_in: Boolean(smsOptIn),
  };
}
