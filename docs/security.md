# Security Notes

`.env*` files are ignored. OAuth, MongoDB, and NextAuth configuration is read from environment variables; do not log connection strings or provider secrets. Deck endpoints use the authentication middleware indicated by their controller.

Review authentication, authorization, room handling, Socket.IO, CORS, and deployment changes before release. Run `npm audit` as part of dependency review; this document is operational guidance, not a security certification.

Use Node 24.22.1 or a newer patched release within the supported Node 24 line. `npm run audit:dependencies` checks the complete lockfile for known advisories and runs in CI. Dependabot proposes weekly npm, Docker, and GitHub Actions updates.

Global banlist writes require an authenticated account ID listed in the server-only `BANLIST_ADMIN_USER_IDS` setting. Empty configuration disables writes. Never use a client-provided role, display name, or email as a substitute for this check.

Custom Express writes require a signed double-submit CSRF token bound to the NextAuth JWT session. A dedicated login identifier survives routine JWT refreshes and rotates at sign-in. Authenticated clients obtain a token from `GET /api/csrf` and send it as `X-CSRF-Token` with the matching HttpOnly cookie. Tokens are not accepted from URL parameters or request bodies. The endpoint is not cacheable. Tokens issued for a different session are rejected, including another login to the same account.

Use the dedicated client in `src/client/utils/http.ts` for application Axios requests and `csrfFetch` for fetch writes. They refresh tokens before new writes, coalesce concurrent token reads, and only attach tokens to the application origin. Do not bypass the middleware in tests; use `csrfHeaders` for authenticated Playwright fixture writes. NextAuth's `/api/auth` routes retain their own CSRF handling. Public GET/HEAD/OPTIONS requests remain available without tokens.

`NEXTAUTH_SECRET` must be configured. Set `NEXTAUTH_URL` to the public HTTPS application URL in production; CSRF cookies then use Secure and the `__Host-` prefix. Origin checks compare against this configured URL rather than trusting forwarded Host headers. Cross-origin and cross-site write requests are rejected even when they contain a valid token.
