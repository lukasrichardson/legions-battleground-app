import { CARD_TYPE } from "@/shared/enums/CardType";
import { LEGIONS } from "./legions.constants";

export const legionColours = {
  [LEGIONS.ANGELS]: "darkkhaki",
  [LEGIONS.DEMONS]: "darkred",
  [LEGIONS.UNDEAD]: "purple",
  [LEGIONS.MYTHICALBEASTS]: "deeppink",
  [LEGIONS.ORCS]: "green",
  [LEGIONS.DWARFS]: "#1a1a1a",
  [LEGIONS.HEROES]: "darkblue",
  [LEGIONS.TITANS]: "darkgoldenrod",
  [LEGIONS.BOUNTY]: "dimgray",
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