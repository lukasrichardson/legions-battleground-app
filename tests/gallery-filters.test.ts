import { describe, expect, it } from "vitest";
import { copyGalleryFilters, countGalleryFilters, emptyGalleryFilters } from "../src/app/cards/galleryFilters";

describe("gallery filter drafts", () => {
  it("creates isolated draft filters so cancel cannot change applied filters", () => {
    const applied = { ...emptyGalleryFilters(), legion: ["Angels"], rarity: ["Rare"] };
    const draft = copyGalleryFilters(applied);
    draft.legion.push("Titans");
    expect(applied.legion).toEqual(["Angels"]);
    expect(countGalleryFilters(draft)).toBe(3);
  });

  it("resets every filter field to a deterministic empty state", () => {
    expect(emptyGalleryFilters()).toEqual({ legion: [], type: [], rarity: [], set: [], srlStatus: [] });
  });
});
