import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";

const e2eUsers = {
  "e2e-player-one": { id: "e2e-player-one", name: "E2E Player One", email: "e2e-player-one@example.test" },
  "e2e-player-two": { id: "e2e-player-two", name: "E2E Player Two", email: "e2e-player-two@example.test" },
} as const;

// This provider is deliberately unavailable to production deployments. It gives the
// browser suite a normal NextAuth JWT without storing OAuth credentials in CI.
const e2eProvider = process.env.E2E_TEST_MODE === "true" && process.env.NODE_ENV !== "production"
  ? [CredentialsProvider({
      id: "e2e",
      name: "E2E Test User",
      credentials: { userId: { label: "Test user", type: "text" } },
      authorize: async (credentials) => {
        const userId = typeof credentials?.userId === "string" ? credentials.userId : "";
        return e2eUsers[userId as keyof typeof e2eUsers] ?? null;
      },
    })]
  : [];

// NextAuth v4 style for App Router
const authOptions: NextAuthOptions = {
  providers: [
    ...e2eProvider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      issuer: "https://discord.com",
      authorization: {
        params: {
          scope: "identify email",
          prompt: "none"
        },
      },
      httpOptions: {
        timeout: 10000, // 10 second timeout
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: async ({ session, token }) => {
      // Add user ID to session
      if (token.sub && session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
