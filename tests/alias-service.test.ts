import { describe, expect, it } from "vitest";
import { AliasValidationError, normalizeAlias } from "@/server/services/api/AliasService";

describe("Battleground aliases", () => {
  it("keeps the selected display casing while normalizing a uniqueness key", () => {
    expect(normalizeAlias("  Legion_Master-7 ")).toEqual({
      alias: "Legion_Master-7",
      aliasKey: "legion_master-7",
    });
  });

  it.each(["ab", "a".repeat(25), "legion master", "legion!", ""]) ("rejects invalid alias %j", (alias) => {
    expect(() => normalizeAlias(alias)).toThrow(AliasValidationError);
  });
});
