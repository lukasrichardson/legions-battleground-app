import { describe, expect, it } from "vitest";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { cardTypeFromCatalogCard, isTokenCard } from "../scripts/migrateDeckTokens";

describe("deck token migration", () => {
  it("identifies tokens from Mongo's full card_type.names projection", () => {
    const projectedCard = { card_type: { names: [CARD_TYPE.TOKEN] } };

    expect(isTokenCard(cardTypeFromCatalogCard(projectedCard))).toBe(true);
  });

  it("does not move ordinary draw-deck cards", () => {
    expect(isTokenCard(CARD_TYPE.WARRIOR)).toBe(false);
  });
});
