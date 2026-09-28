import { describe, expect, it } from "vitest";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { cardTypeFromCatalogCard, specialFieldForCardType } from "../scripts/migrateDeckSpecialCardArrays";

describe("deck special-card migration", () => {
  it("classifies a card from Mongo's full card_type.names projection", () => {
    const projectedCard = { card_type: { names: [CARD_TYPE.VEIL_REALM] } };

    expect(cardTypeFromCatalogCard(projectedCard)).toBe(CARD_TYPE.VEIL_REALM);
    expect(specialFieldForCardType(cardTypeFromCatalogCard(projectedCard))).toBe("veilRealms");
  });

  it("does not classify unrelated card types as special main-deck cards", () => {
    expect(specialFieldForCardType(CARD_TYPE.WARRIOR)).toBeNull();
  });
});
