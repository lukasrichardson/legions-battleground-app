const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27018";
const DEFAULT_MONGO_DB_NAME = "legions_battleground_e2e";
const DEFAULT_CARD_IMAGE_BASE_URL = "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev/";
const LOCAL_MONGO_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** @param {Record<string, string | undefined>} source */
export function resolveE2eEnvironment(source = process.env) {
  if (source.E2E_TEST_MODE !== "true") {
    throw new Error("Refusing to run E2E setup without E2E_TEST_MODE=true.");
  }

  const mongoUrl = source.E2E_MONGO_URL ?? DEFAULT_MONGO_URL;
  const mongoDbName = source.E2E_MONGO_DB_NAME ?? DEFAULT_MONGO_DB_NAME;
  assertSafeE2eDatabase(mongoUrl, mongoDbName);
  const cardImageBaseUrl = resolveCardImageBaseUrl(
    source.E2E_CARD_IMAGE_BASE_URL ?? source.R2_PUBLIC_BASE_URL ?? DEFAULT_CARD_IMAGE_BASE_URL,
  );

  return {
    NODE_ENV: "development",
    E2E_TEST_MODE: "true",
    MONGO_URL: mongoUrl,
    MONGO_DB_NAME: mongoDbName,
    NEXTAUTH_URL: source.NEXTAUTH_URL ?? "http://localhost:3100",
    NEXTAUTH_SECRET: source.NEXTAUTH_SECRET ?? "e2e-only-not-for-production",
    E2E_CARD_IMAGE_BASE_URL: cardImageBaseUrl,
  };
}

function resolveCardImageBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("E2E_CARD_IMAGE_BASE_URL must be a valid public URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("E2E_CARD_IMAGE_BASE_URL must use http or https.");
  }

  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

export function assertSafeE2eDatabase(mongoUrl, mongoDbName) {
  let url;
  try {
    url = new URL(mongoUrl);
  } catch {
    throw new Error("E2E_MONGO_URL must be a valid MongoDB connection URL.");
  }

  if (url.protocol !== "mongodb:" || !LOCAL_MONGO_HOSTS.has(url.hostname)) {
    throw new Error("E2E_MONGO_URL must use mongodb:// with a local host.");
  }

  if (!/^[A-Za-z0-9_-]+_e2e$/.test(mongoDbName)) {
    throw new Error("E2E_MONGO_DB_NAME must end in _e2e.");
  }
}
