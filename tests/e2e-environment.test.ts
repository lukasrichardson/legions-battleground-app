import { describe, expect, it } from "vitest";
import { resolveE2eEnvironment } from "../e2e/environment.mjs";

describe("E2E database environment", () => {
  it("uses its local disposable defaults and ignores regular Mongo variables", () => {
    const environment = resolveE2eEnvironment({
      E2E_TEST_MODE: "true",
      MONGO_URL: "mongodb://example.test:27017/production",
      MONGO_DB_NAME: "production",
    });

    expect(environment.MONGO_URL).toBe("mongodb://127.0.0.1:27018");
    expect(environment.MONGO_DB_NAME).toBe("legions_battleground_e2e");
    expect(environment.E2E_CARD_IMAGE_BASE_URL).toMatch(/^https:\/\//);
  });

  it("uses an explicitly configured public card-image host", () => {
    const environment = resolveE2eEnvironment({
      E2E_TEST_MODE: "true",
      E2E_CARD_IMAGE_BASE_URL: "https://images.example.test/e2e/v1",
    });

    expect(environment.E2E_CARD_IMAGE_BASE_URL).toBe("https://images.example.test/e2e/v1/");
  });

  it("accepts an explicitly local E2E database override", () => {
    const environment = resolveE2eEnvironment({
      E2E_TEST_MODE: "true",
      E2E_MONGO_URL: "mongodb://localhost:27019",
      E2E_MONGO_DB_NAME: "feature_e2e",
    });

    expect(environment.MONGO_URL).toBe("mongodb://localhost:27019");
    expect(environment.MONGO_DB_NAME).toBe("feature_e2e");
  });

  it.each([
    [{}, "E2E_TEST_MODE=true"],
    [{ E2E_TEST_MODE: "true", E2E_MONGO_URL: "mongodb://db.example.test:27017" }, "local host"],
    [{ E2E_TEST_MODE: "true", E2E_MONGO_URL: "mongodb+srv://cluster.example.test" }, "local host"],
    [{ E2E_TEST_MODE: "true", E2E_MONGO_DB_NAME: "development" }, "end in _e2e"],
    [{ E2E_TEST_MODE: "true", E2E_CARD_IMAGE_BASE_URL: "file:///tmp/cards" }, "http or https"],
  ])("rejects unsafe setup: %o", (environment, message) => {
    expect(() => resolveE2eEnvironment(environment)).toThrow(message);
  });
});
