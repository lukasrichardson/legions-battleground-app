import { CARD_TYPE } from "@/shared/enums/CardType";

export const cardTypeAbbreviations: Record<CARD_TYPE, string> = {
  [CARD_TYPE.WARRIOR]: "WARR",
  [CARD_TYPE.UNIFIED]: "UNFD",
  [CARD_TYPE.FORTIFIED]: "FORT",
  [CARD_TYPE.TOKEN]: "TOK",
  [CARD_TYPE.VEIL_REALM]: "V/R",
  [CARD_TYPE.WARLORD]: "WRLD",
  [CARD_TYPE.SYNERGY]: "SYN",
  [CARD_TYPE.GUARDIAN]: "GRDN",
}