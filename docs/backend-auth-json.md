# Backend: return JWTs in JSON for the SPA

The browser app keeps **`nudge_access_token`** and **`nudge_refresh_token`** in **`sessionStorage`** and sends **`Authorization: Bearer &lt;access_token&gt;`** on requests (`src/api/httpClient.js`). That path works when **cookies are not sent** (cross-origin, Safari, `Secure` cookies on `http://`, etc.) or when the API only validates **Bearer**, not cookies.

**Recommendation:** On **`POST /auth/login`**, **`POST /auth/register`**, and **`POST /auth/refresh`**, include **`access_token`** and **`refresh_token`** in the **JSON body** (in addition to any `Set-Cookie` you already issue). The client merges tokens from the body on every auth response.

## Preferred response shape (top-level)

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "user": {}
}
```

`user` (or your existing profile object) can stay as you have it today; the important part for the SPA is the two JWT strings.

## Other shapes the frontend understands

Parsed by `extractAuthTokens` in `nudge/src/auth/tokenStorage.js`:

| Location | Access | Refresh |
|----------|--------|---------|
| Top-level | `access_token`, `accessToken`, `access`, `token` | `refresh_token`, `refreshToken` |
| `tokens` | same | same |
| `token` (object) | same | same |
| `data` | same | same |
| `oauth` | same | — |

Optional: **`X-Access-Token`** or **`Authorization: Bearer ...`** on the response — see `mergeAuthTokensFromAxiosResponse` in the same file.

## Register

If **`POST /auth/register`** returns the same token fields, the SPA will store them the same way as login.
