import { CARD_TYPE } from "@/shared/enums/CardType";
import { EffectStep } from "./SequenceInterfaces";

export interface CardInterface {
  id?: string;
  name?: string;
  type: CARD_TYPE;
  img?: string;
  code?: string;
  faceUp?: boolean;
  attackModifier?: number;
  otherModifier?: number;
  cooldown?: number;
  //
  text: string;

  //guardians only => all pre game effects eventually?
  preGameEffect?: EffectStep[];
  effect?: EffectStep[];
}
