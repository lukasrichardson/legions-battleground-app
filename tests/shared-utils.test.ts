import { describe, expect, it } from "vitest";
import { multiSelectCardHelper, selectCardHelper } from "../src/shared/utils";
import { renderNumberthSuffix } from "../src/server/utils/string.utils";
import { appendQueryParams } from "../src/client/utils/string.util";

describe("card selection helpers", () => {
  const first = { id: "first" };
  const second = { id: "second" };

  it("keeps one selected card and clears it when selected again", () => {
    expect(selectCardHelper([], first)).toEqual([first]);
    expect(selectCardHelper([first], first)).toEqual([]);
    expect(selectCardHelper([first], second)).toEqual([second]);
  });

  it("adds and removes cards from a multi-selection", () => {
    expect(multiSelectCardHelper([first], second)).toEqual([first, second]);
    expect(multiSelectCardHelper([first, second], first)).toEqual([second]);
  });
});

describe("renderNumberthSuffix", () => {
  it("uses English ordinal suffixes, including teen exceptions", () => {
    expect(renderNumberthSuffix(1)).toBe("st");
    expect(renderNumberthSuffix(2)).toBe("nd");
    expect(renderNumberthSuffix(3)).toBe("rd");
    expect(renderNumberthSuffix(4)).toBe("th");
    expect(renderNumberthSuffix(11)).toBe("th");
    expect(renderNumberthSuffix(12)).toBe("th");
    expect(renderNumberthSuffix(13)).toBe("th");
    expect(renderNumberthSuffix(21)).toBe("st");
  });
});

describe("card-filter query encoding", () => {
  it("sends every selected S/R/L status to the cards endpoint", () => {
    const url = appendQueryParams("https://app.example/api/cards", {
      srlStatus: ["suspended", "limited"],
    });
    expect(new URL(url).searchParams.getAll("srlStatus")).toEqual(["suspended", "limited"]);
  });
});
