import { describe, expect, it } from "vitest";
import { CARD_TARGET } from "../src/shared/enums/CardTarget";
import { CARD_TYPE } from "../src/shared/enums/CardType";
import MenuItemAction from "../src/client/enums/MenuItemAction";
import { findMenuItemByKey, getMenuItemsForCard } from "../src/client/utils/cardMenu.utils";

describe("contextual card actions", () => {
  it("puts the primary action first and groups destinations under Move to", () => {
    const items = getMenuItemsForCard(
      { id: "warrior", name: "Warrior", type: CARD_TYPE.WARRIOR, text: "" },
      CARD_TARGET.P1_PLAYER_HAND,
      false,
    );

    expect(items[0].label).toBe("Conscript");
    expect(items[1].label).toBe("Move to…");
    expect(items[1].children?.map((item) => item.label)).not.toContain("To Hand");
    expect(items[1].children?.map((item) => item.label)).toContain("To Discard");
  });

  it("resolves an action inside the destination submenu", () => {
    const items = getMenuItemsForCard(
      { id: "warrior", name: "Warrior", type: CARD_TYPE.WARRIOR, text: "" },
      CARD_TARGET.P1_PLAYER_DISCARD,
      true,
    );

    const destination = findMenuItemByKey(items, "0");
    expect(destination?.label).toBe("To Hand");
    expect(destination?.menuAction).toBe(MenuItemAction.MOVE);
    expect(destination?.target).toBe(CARD_TARGET.CONTROLLER_HAND);
  });
});
