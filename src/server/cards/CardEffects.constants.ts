import {SequenceItem, StepType} from "../interfaces/SequenceInterfaces";
import {CARD_TARGET} from "../../shared/enums/CardTarget";

//guardians

//warrior keywords
export const PlunderP1: SequenceItem = {
  name: "Plunder P1",
  cost: [],
  effect: [
    {
      type: StepType.DrawCard,
      from: [{ target: CARD_TARGET.P1_PLAYER_DECK, targetIndex: null }],
      to: [{ target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null }],
      quantity: 1,
      random: true
    }
  ],
  type: "moveCards"
}

export const PlunderP2: SequenceItem = {
  name: "Plunder P2",
  cost: [],
  effect: [
    {
      type: StepType.DrawCard,
      from: [{ target: CARD_TARGET.P2_PLAYER_DECK, targetIndex: null }],
      to: [{ target: CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }],
      quantity: 1,
      random: true
    }
  ],
  type: "moveCards"
}