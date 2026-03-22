# SMS & toll-free verification (frontend flow)

The SPA treats SMS as **fully enabled** only when **`GET /auth/me`** shows:

- `sms_opt_in === true`
- A valid saved **`phone`** / **`phone_e164`** (E.164)
- **`phone_verified === true`** (backend computed from **`phone_verified_at`**; the UI prefers this flag for gating)

Keep **`phone_verified_at`** when you need the exact verification time (ISO string).

Until then, outbound test SMS and daily check-ins may be blocked by the API even if the user opted in.

## API calls (authenticated)

| Step | Method | Path | Body |
|------|--------|------|------|
| Save profile | `POST` | `/auth/register` or `PATCH` | Same optional fields as today: `phone`, `phone_e164`, `sms_opt_in`, etc. |
| Send code | `POST` | `/auth/me/phone/send-verification-code` | None — response is **AuthMeResponse** (same shape as `/auth/me`). |
| Verify code | `POST` | `/auth/me/phone/verify` | `{ "code": "123456" }` (6 digits) — response **AuthMeResponse** with **`phone_verified: true`**. |
| Test SMS | `POST` | `/auth/me/sms/test` | None (only after verified + SMS on) |

Changing **`phone_e164`** via **`PATCH /auth/me`** clears **`phone_verified_at`** on the server; the UI must show **verify again**.

## UI state (from `GET /auth/me`)

| Condition | What the UI does |
|-----------|-------------------|
| `sms_opt_in === false` | Hide verification and test SMS for SMS. |
| `sms_opt_in === true`, no usable E.164 on profile | Prompt to add/save a number (or turn SMS off). |
| `sms_opt_in === true`, phone present, **`phone_verified` false** | “Verify your number”: **Send verification code** → 6-digit field → **Verify code** → merge **AuthMeResponse** into client state (no extra `GET /auth/me` required). |
| Verified + SMS on | Show **Send test SMS**; short note that **Twilio toll-free approval** can still delay delivery until the number is verified in Twilio Console. |

## Registration

After **`POST /auth/register`** succeeds with **`sms_opt_in: true`** and a valid **`phone_e164`**, the app navigates to **Settings**, auto-sends one verification code (best effort), and shows the code entry step. SMS is **not** presented as “fully on” until **`phone_verified`** is true (and **`phone_verified_at`** is set on the server).

## Implementation files

- `nudge/src/api/authApi.js` — `postSendPhoneVerificationCode`, `postVerifyPhoneCode`; normalized user includes **`phoneVerified`** and **`phoneVerifiedAt`**
- `nudge/src/auth/AuthContext.jsx` — **`applyMeResponse`** merges AuthMeResponse from PATCH / verify / send-code without a follow-up GET
- `nudge/src/utils/smsVerification.js` — **`isPhoneVerified`** (prefers `phone_verified`), `needsPhoneVerification`, `isSmsFullyEnabled`, `hasSavedSmsPhone`
- `nudge/src/pages/SettingsPage.jsx` — SMS status block, verification UI (no nested `<form>`), gated test SMS
- `nudge/src/pages/SignupPage.jsx` — post-register redirect to settings + verification copy on the SMS checkbox
- `nudge/src/auth/sessionKeys.js` — cache `phoneVerifiedAt` for display fallback
