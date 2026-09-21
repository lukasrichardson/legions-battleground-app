# Security Notes

`.env*` files are ignored. OAuth, MongoDB, and NextAuth configuration is read from environment variables; do not log connection strings or provider secrets. Deck endpoints use the authentication middleware indicated by their controller.

Review authentication, authorization, room handling, Socket.IO, CORS, and deployment changes before release. Run `npm audit` as part of dependency review; this document is operational guidance, not a security certification.
