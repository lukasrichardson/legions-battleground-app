import { describe, expect, it } from "vitest";
import { getDatabaseName } from "@/server/utils/database.util";

describe("database configuration", () => {
  it("uses the explicitly configured database name", () => {
    expect(getDatabaseName({ MONGO_DB_NAME: "staging" })).toBe("staging");
  });

  it("fails fast without a database name", () => {
    expect(() => getDatabaseName({})).toThrow("MONGO_DB_NAME environment variable is required");
  });
});
