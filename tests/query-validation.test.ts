import { describe, expect, it } from "vitest";
import { MAX_CARD_PAGE_SIZE, MAX_CARD_SEARCH_LENGTH, parseCardPagination, parseCardSearch } from "@/server/utils/queryValidation.util";

describe("card query validation", () => {
  it("uses safe bounded pagination", () => {
    expect(parseCardPagination("3", "25")).toEqual({ page: 3, pageSize: 25 });
    expect(parseCardPagination("-2", "0")).toEqual({ page: 1, pageSize: 50 });
    expect(parseCardPagination("1", "9999")).toEqual({ page: 1, pageSize: MAX_CARD_PAGE_SIZE });
  });

  it("escapes regex syntax and bounds literal searches", () => {
    expect(parseCardSearch("  (foo)+.*  ")).toBe("\\(foo\\)\\+\\.\\*");
    expect(parseCardSearch("x".repeat(MAX_CARD_SEARCH_LENGTH + 1))).toHaveLength(MAX_CARD_SEARCH_LENGTH);
    expect(parseCardSearch("   ")).toBeUndefined();
  });
});
