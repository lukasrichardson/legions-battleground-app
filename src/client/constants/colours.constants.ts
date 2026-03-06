import { CARD_TYPE } from "@/shared/enums/CardType";
import { LEGIONS } from "./legions.constants";

export const legionColours = {
  [LEGIONS.ANGELS]: "rgba(255, 215, 0, 0.7)",
  [LEGIONS.DEMONS]: "rgba(255, 0, 0, 0.6)",
  [LEGIONS.UNDEAD]: "rgba(128, 0, 128, 0.6)",
  [LEGIONS.MYTHICALBEASTS]: "rgba(255, 20, 147, 0.6)",
  [LEGIONS.ORCS]: "rgba(0, 128, 0, 0.6)",
  [LEGIONS.DWARFS]: "rgba(16, 16, 16, 0.6)",
  [LEGIONS.HEROES]: "rgba(0, 0, 139, 0.6)",
  [LEGIONS.TITANS]: "rgba(255, 165, 0, 0.7)",
  [LEGIONS.BOUNTY]: "rgba(105, 105, 105, 0.6)",
}

export const cardTypeColours = {
  [CARD_TYPE.WARRIOR]: "chocolate",
  [CARD_TYPE.UNIFIED]: "teal",
  [CARD_TYPE.FORTIFIED]: "salmon",
  [CARD_TYPE.TOKEN]: "maroon",
  [CARD_TYPE.VEIL_REALM]: "khaki",
  [CARD_TYPE.WARLORD]: "lavender",
  [CARD_TYPE.SYNERGY]: "lime",
  [CARD_TYPE.GUARDIAN]: "turquoise",


}