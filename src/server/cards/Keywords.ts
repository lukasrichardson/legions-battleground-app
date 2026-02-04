import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { SequenceItem, StepType } from "../interfaces/SequenceInterfaces";
interface Keyword {
  name: string,
  triggers: KeywordTrigger[],
  keywordType: KeywordType,
  sequenceItem?: SequenceItem,
  conditions?: {
    target: CARD_TARGET,
    minSize?: number,
    maxSize?: number,
    regex?: string
  }[]
}
enum KeywordType {
  ACTIVE = "active",
  PASSIVE = "passive",
}
export enum KeywordTrigger {
  CONSCRIPT = "conscript",
  PERISH = "perish",
  MANUAL_OPT = "manual_oncePerTurn",
  AUTOMATIC_OPT = "automatic_oncePerTurn",
  MILL_DISCARD = "mill_discard",
  MILL_ERAD = "mill_erad",
  ETB = "enter_the_battlefield",
  LTB = "leave_the_battlefield",
}

const Bloodbourne5 = {
  type: StepType.ChangeHealth,
  quantity: -5
}

const Abolish: Keyword = {
  name: "Abolish",
  triggers: [KeywordTrigger.CONSCRIPT],
  keywordType: KeywordType.ACTIVE,
  sequenceItem: {
    name: "Abolish",
    cost: [Bloodbourne5],
    effect: [], //todo
    type: CARD_TYPE.WARRIOR,
  },
}
const Afterlife: Keyword = {
  name: "Afterlife",
  triggers: [KeywordTrigger.MILL_DISCARD, KeywordTrigger.MILL_ERAD],
  keywordType: KeywordType.ACTIVE,
  conditions: [{
    target: CARD_TARGET.CONTROLLER_WARRIOR,
    maxSize: 4
  }],
  sequenceItem: {
    name: "Afterlife",
    cost: [Bloodbourne5],
    effect: [], //todo
    type: CARD_TYPE.WARRIOR,
  }
}
const Apocalypse: Keyword = {
  name: "Apocalypse",
  triggers: [KeywordTrigger.ETB, KeywordTrigger.LTB],
  keywordType: KeywordType.ACTIVE,
  sequenceItem: {
    name: "Apocalypse",
    cost: [],
    effect: [], //todo
    type: CARD_TYPE.WARRIOR,
  }
}
//need to handle bestow separately
const Bestow: Keyword = {
  name: "Bestow",
  triggers: [],
  keywordType: KeywordType.PASSIVE,
}

//need to handle blockade (and all passive keywords sepparately)
const Blockade: Keyword = {
  name: "Blockade",
  triggers: [],
  keywordType: KeywordType.PASSIVE,
}

const Brew: Keyword = {
  name: "Brew",
  triggers: [KeywordTrigger.ETB],
  keywordType: KeywordType.ACTIVE,
  conditions: [{
    target: CARD_TARGET.CONTROLLER_DECK,
    minSize: 1,
    regex: "Alehouse Drink"
  }],
  sequenceItem: {
    name: "Brew",
    type: CARD_TYPE.WARRIOR,
    cost: [],
    effect: [
      {
        type: StepType.ChooseCards,
        selectMin: 1,
        selectMax: 1,
        selected: [],
        from: [{ target: CARD_TARGET.CONTROLLER_DECK, targetIndex: null }],
        to: [{ target: CARD_TARGET.CONTROLLER_HAND, targetIndex: null }],
        waitingForInput: { p1: false, p2: false, controller: true },
      }, {
        type: StepType.MoveCard,
        from: [{ target: CARD_TARGET.CONTROLLER_DECK, targetIndex: null }],
        to: [{ target: CARD_TARGET.CONTROLLER_HAND, targetIndex: null }],
        selected: [],
      }], //todo
  },
}

export const ALL_KEYWORDS = {
  Abolish,
  Afterlife,
  Apocalypse,
  Bestow,
  Blockade,
  Brew
}