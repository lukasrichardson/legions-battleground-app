# Security Notes

`.env*` files are ignored. OAuth, MongoDB, and NextAuth configuration is read from environment variables; do not log connection strings or provider secrets. Deck endpoints use the authentication middleware indicated by their controller.

Review authentication, authorization, room handling, Socket.IO, CORS, and deployment changes before release. Run `npm audit` as part of dependency review; this document is operational guidance, not a security certification.

Use Node 24.22.1 or a newer patched release within the supported Node 24 line. `npm run audit:dependencies` checks the complete lockfile for known advisories and runs in CI. Dependabot proposes weekly npm, Docker, and GitHub Actions updates.

Global banlist writes require an authenticated account ID listed in the server-only `BANLIST_ADMIN_USER_IDS` setting. Empty configuration disables writes. Never use a client-provided role, display name, or email as a substitute for this check.
