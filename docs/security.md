# Security Notes

The existing security review is preserved in [Security audit details](./security-audit.md).

Authentication uses NextAuth OAuth providers, while protected server routes use Express authentication middleware and user-scoped deck operations. Treat the audit as a dated review rather than a permanent security guarantee; repeat it when authentication, authorization, dependencies, or deployment configuration changes.
