import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "@/shared/interfaces/CardState";
import IMenuItem from "../interfaces/IMenuItem";
import { newCardMenuItems, newDeckMenuItems, newDiscardMenuItems, newFortifiedMenuItems, newOnFieldMenuItems, newUnifiedMenuItems, newWarriorMenuItems, cardMenuItems, deckMenuItems, newEradicationMenuItems } from "../constants/cardMenu.constants";
import { CARD_TYPE } from "@/shared/enums/CardType";
import MenuItemAction from "../enums/MenuItemAction";

const controllerTargetMap = {
  [CARD_TARGET.CONTROLLER_DECK]: [CARD_TARGET.P1_PLAYER_DECK, CARD_TARGET.P2_PLAYER_DECK],
  [CARD_TARGET.CONTROLLER_WARRIOR]: [CARD_TARGET.P1_PLAYER_WARRIOR, CARD_TARGET.P2_PLAYER_WARRIOR],
  [CARD_TARGET.CONTROLLER_UNIFIED]: [CARD_TARGET.P1_PLAYER_UNIFIED, CARD_TARGET.P2_PLAYER_UNIFIED],
  [CARD_TARGET.CONTROLLER_FORTIFIED]: [CARD_TARGET.P1_PLAYER_FORTIFIED, CARD_TARGET.P2_PLAYER_FORTIFIED],
  [CARD_TARGET.CONTROLLER_DISCARD]: [CARD_TARGET.P1_PLAYER_DISCARD, CARD_TARGET.P2_PLAYER_DISCARD],
  [CARD_TARGET.CONTROLLER_ERADICATION]: [CARD_TARGET.P1_PLAYER_ERADICATION, CARD_TARGET.P2_PLAYER_ERADICATION],
  [CARD_TARGET.CONTROLLER_HAND]: [CARD_TARGET.P1_PLAYER_HAND, CARD_TARGET.P2_PLAYER_HAND],
};

export const getMenuItemsForCard = (card: CardState, cardTarget: CARD_TARGET, inPileView: boolean): IMenuItem[] => {
  if (cardTarget.includes("Deck") && !inPileView) {
    return [...newDeckMenuItems]
  }
  let filteredMenuItems = [...newCardMenuItems];

  if ( // If the card is on the field, show the on-field options
    cardTarget === CARD_TARGET.P1_PLAYER_WARRIOR ||
    cardTarget === CARD_TARGET.P1_PLAYER_UNIFIED ||
    cardTarget === CARD_TARGET.P1_PLAYER_FORTIFIED ||
    cardTarget === CARD_TARGET.P2_PLAYER_WARRIOR ||
    cardTarget === CARD_TARGET.P2_PLAYER_UNIFIED ||
    cardTarget === CARD_TARGET.P2_PLAYER_FORTIFIED
  ) {
    filteredMenuItems = [...filteredMenuItems, ...newOnFieldMenuItems];
  } else { //card off field
    if (card.type === CARD_TYPE.WARRIOR) {
      filteredMenuItems = [...filteredMenuItems, ...newWarriorMenuItems];
    }
    if (card.type === CARD_TYPE.UNIFIED) {
      filteredMenuItems = [...filteredMenuItems, ...newUnifiedMenuItems];
    }
    if (card.type === CARD_TYPE.FORTIFIED) {
      filteredMenuItems = [...filteredMenuItems, ...newFortifiedMenuItems];
    }
  }
  if (cardTarget === CARD_TARGET.P1_PLAYER_DISCARD || cardTarget === CARD_TARGET.P2_PLAYER_DISCARD) {
    filteredMenuItems = [...filteredMenuItems, ...newDiscardMenuItems];
  }
  if (cardTarget === CARD_TARGET.P1_PLAYER_ERADICATION || cardTarget === CARD_TARGET.P2_PLAYER_ERADICATION) {
    filteredMenuItems = [...filteredMenuItems, ...newEradicationMenuItems];
  }
  filteredMenuItems = filteredMenuItems.filter(item => !item.target || ((item?.target !== cardTarget) && (!controllerTargetMap[item?.target]?.includes(cardTarget))));
  return filteredMenuItems;
}

export const getMenuItemsForCardLegacy = (inPileView: boolean, cardTarget: CARD_TARGET) => {
  let filteredMenuItems = [...cardMenuItems];
  if (inPileView) filteredMenuItems = filteredMenuItems.filter(item => item.menuAction != MenuItemAction.VIEW);
  if (cardTarget.includes("Deck")) filteredMenuItems = [...filteredMenuItems, ...deckMenuItems];
  return filteredMenuItems;
}