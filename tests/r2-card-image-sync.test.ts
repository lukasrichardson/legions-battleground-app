import { describe, expect, it } from "vitest";
import { collectToolboxImageUrls, findObjectKeyCollisions, mergeToolboxImageUrls, toPublicR2Url, toR2ObjectKey } from "@/server/utils/r2CardImageSync";

describe("R2 card-image keys", () => {
  it("maps a Toolbox upload URL to a stable R2 key", () => {
    const url = "https://api.legionstoolbox.com/wp-content/uploads/2023/07/RVL-128-450x616.png?size=thumb";
    expect(toR2ObjectKey(url)).toBe("cards/RVL-128-450x616.png");
  });

  it("maps legacy Toolbox website URLs to the same stable R2 key", () => {
    expect(toR2ObjectKey("https://legionstoolbox.com/wp-content/uploads/2024/05/Frozen-Adventurer-Glaciana-450x616.png"))
      .toBe("cards/Frozen-Adventurer-Glaciana-450x616.png");
  });

  it("rejects non-Toolbox URLs and non-image uploads", () => {
    expect(toR2ObjectKey("https://example.com/wp-content/uploads/card.png")).toBeNull();
    expect(toR2ObjectKey("https://api.legionstoolbox.com/wp-content/uploads/card.pdf")).toBeNull();
  });

  it("finds only valid Toolbox images recursively", () => {
    const urls = collectToolboxImageUrls({ thumb: "https://api.legionstoolbox.com/wp-content/uploads/a.png", nested: ["ignore", "https://example.com/card.png"] });
    expect([...urls]).toEqual(["https://api.legionstoolbox.com/wp-content/uploads/a.png"]);
  });

  it("builds a public URL without duplicate slashes", () => {
    expect(toPublicR2Url("https://images.example.dev/", "cards/path.png")).toBe("https://images.example.dev/cards/path.png");
  });

  it("detects source paths that would overwrite the same filename", () => {
    const collisions = findObjectKeyCollisions([
      "https://api.legionstoolbox.com/wp-content/uploads/2023/07/RVL-128.png",
      "https://api.legionstoolbox.com/wp-content/uploads/2024/01/RVL-128.png",
    ]);
    expect(collisions.get("cards/RVL-128.png")).toHaveLength(2);
  });

  it("keeps historical Mongo URLs that no longer occur in the Toolbox catalogue", () => {
    const catalogueUrl = "https://api.legionstoolbox.com/wp-content/uploads/2025/01/CURRENT-450x616.png";
    const historicalMongoUrl = "https://api.legionstoolbox.com/wp-content/uploads/2024/01/VARIANT.jpg";
    expect(mergeToolboxImageUrls([catalogueUrl], [historicalMongoUrl, catalogueUrl])).toEqual([
      catalogueUrl,
      historicalMongoUrl,
    ]);
  });
});
