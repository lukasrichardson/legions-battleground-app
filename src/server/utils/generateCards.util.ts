import { CardInterface } from "../../shared/interfaces/CardInterface";
import { CardInDeck, DeckResponse } from "../../shared/interfaces/DeckResponse";
import { CARD_TYPE } from "../../shared/enums/CardType";
import { shuffle } from "./shuffleDeck.util";
import { CARD_TARGET } from "../../shared/enums/CardTarget";
import { StepType } from "../interfaces/SequenceInterfaces";

let nextId = 0;
export const generateStartingPlayersCards = (p2DeckFromServer: DeckResponse, p1DeckFromServer: DeckResponse) => {
  const p2Deck = generateStartingCards(p2DeckFromServer, false);
  const p1Deck = generateStartingCards(p1DeckFromServer, true);

  return ({
    p2Deck,
    p1Deck
  })
}

const generateStartingCards = (deckFromServer: DeckResponse, p1: boolean) => {
  const filteredDeckFromServer = Object.values(deckFromServer?.cards_in_deck || [])
  //to do
  const veilRealmsFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.VEIL_REALM);
  const warlordsFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.WARLORD);
  const synergiesFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.SYNERGY);
  const guardiansFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.GUARDIAN);
  const warriorsFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.WARRIOR);
  const unnifiedsFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.UNIFIED);
  const fortifiedsFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.FORTIFIED);
  const tokensFromServer = filteredDeckFromServer.filter(card => card.card_type.names[0] === CARD_TYPE.TOKEN);
  //
  let veilRealm = [generateVeilRealm(veilRealmsFromServer)];
  veilRealm = veilRealm.map(veil => {
    return {
      ...veil, effect: [{
        type: StepType.ChooseCards,
        selectMin: 0,
        selectMax: 2,
        from: [
          {
            target: CARD_TARGET.P1_PLAYER_WARRIOR, targetIndex: null
          }, {
            target: CARD_TARGET.P1_PLAYER_UNIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P1_PLAYER_FORTIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_WARRIOR,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_UNIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_FORTIFIED,
            targetIndex: null
          }],
        to: [{ target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null, }, { target: CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }],
        selected: [],
        waitingForInput: { p1: p1, p2: !p1, controller: false }
      }, {
        type: StepType.MoveCard,
        selectMin: 0,
        selectMax: 2,
        from: [
          {
            target: CARD_TARGET.P1_PLAYER_WARRIOR, targetIndex: null
          }, {
            target: CARD_TARGET.P1_PLAYER_UNIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P1_PLAYER_FORTIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_WARRIOR,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_UNIFIED,
            targetIndex: null
          },
          {
            target: CARD_TARGET.P2_PLAYER_FORTIFIED,
            targetIndex: null
          }],
        to: [{ target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null, }, { target: CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }]

      }]
    };
  })
  const warlord = [generateWarlord(warlordsFromServer)];
  const synergy = [generateSynergy(synergiesFromServer)];
  const guardians = [generateGuardian(guardiansFromServer)];
  //
  const guardian = [{
    ...guardians?.[0], preGameEffect: [{
      type: StepType.ChooseCards,
      selectMin: 0,
      selectMax: null,
      from: [{ target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }],
      to: [{ target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK, targetIndex: null }],
      selected: [],
      waitingForInput: { p1: p1, p2: !p1, controller: false }
    },
    {
      type: StepType.MoveCard,
      selectMin: 0,
      selectMax: null,
      from: [{ target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }],
      to: [{ target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK, targetIndex: null }],
      selected: []
    }, {
      type: StepType.MoveCard,
      quantity: "selected",
      from: [{ target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK, targetIndex: null }],
      to: [{ target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND, targetIndex: null }]
    }]
  }];
  const discard: CardInterface[] = [];
  const eradication: CardInterface[] = [];
  const revealed: CardInterface[] = [];
  const { deck, hand } = generateDeckAndHand(warriorsFromServer, unnifiedsFromServer, fortifiedsFromServer);
  const playerDeck = [...deck];
  const playerHand = [...hand];
  const fortifieds = [[], [], [], [], []];
  const unifieds = [[], [], [], [], []];
  const warriors = [[], [], [], [], []];
  const tokens = generateTokens(tokensFromServer);
  return ({
    playerDeck,
    playerHand,
    veilRealm,
    warlord,
    synergy,
    guardian,
    discard,
    eradication,
    fortifieds,
    unifieds,
    warriors,
    tokens,
    revealed
  })
}

const generateVeilRealm = (cardsFromServer: CardInDeck[]) => {
  if (!cardsFromServer.length) return generateCard({ name: "Veil Realm", code: "VEIL_REALM", img: "", type: CARD_TYPE.VEIL_REALM, text: "" }, `${nextId}`);
  const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = cardsFromServer[0];
  const card = generateCard({ name, code, img: image, type: (type as CARD_TYPE), cooldown: 3, text }, `${nextId}`);
  nextId++;
  return card;
}
const generateWarlord = (cardsFromServer: CardInDeck[]) => {
  if (!cardsFromServer.length) return generateCard({ name: "Warlord", code: "WARLORD", img: "", type: CARD_TYPE.WARLORD, text: "" }, `${nextId}`);
  const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = cardsFromServer[0];
  const card = generateCard({ name, code, img: image, type: (type as CARD_TYPE), cooldown: 0, text }, `${nextId}`);
  nextId++;
  return card;
}
const generateSynergy = (cardsFromServer: CardInDeck[]) => {
  if (!cardsFromServer.length) return generateCard({ name: "Synergy", code: "SYNERGY", img: "", type: CARD_TYPE.SYNERGY, text: "" }, `${nextId}`);
  const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = cardsFromServer[0];
  const card = generateCard({ name, code, img: image, type: (type as CARD_TYPE), cooldown: 0, text }, `${nextId}`);
  nextId++;
  return card;
}
const generateGuardian = (cardsFromServer: CardInDeck[]) => {
  if (!cardsFromServer.length) return generateCard({ name: "Guardian", code: "GUARDIAN", img: "", type: CARD_TYPE.GUARDIAN, text: "" }, `${nextId}`);
  const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = cardsFromServer[0];
  const card = generateCard({ name, code, img: image, type: (type as CARD_TYPE), text }, `${nextId}`);
  nextId++;
  return card;
}

const generateDeck = (warriors: CardInDeck[], unifieds: CardInDeck[], fortifieds: CardInDeck[]) => {
  const deck: CardInterface[] = [];
  [...warriors, ...unifieds, ...fortifieds].forEach(card => {
    const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = card;

    const generatedCard = generateCard({ name: name, code: code, img: image, type: (type as CARD_TYPE), text }, `${nextId}`);
    nextId++;
    deck.push(generatedCard);
  });

  return shuffle(deck);
}

const generateDeckAndHand = (warriors: CardInDeck[], unifieds: CardInDeck[], fortifieds: CardInDeck[]): { deck: CardInterface[], hand: CardInterface[] } => {
  const deck = generateDeck(warriors, unifieds, fortifieds);
  const hand: CardInterface[] = [];
  for (let i = 0; i < 6; i++) {
    hand.push(deck.pop() as CardInterface);
  }
  return { deck, hand };
}

const generateTokens = (tokensFromServer: CardInDeck[]) => {
  const tokens: CardInterface[] = [];
  tokensFromServer.forEach(token => {
    const { title: name, card_code: code, featured_image: image, card_type: { names: [type] }, text } = token;
    const generatedToken = generateCard({ name: name, code: code, img: image, type: (type as CARD_TYPE), text }, `${nextId}`);
    nextId++;
    tokens.push(generatedToken);
  });
  return tokens;
}

const generateCard = (card: CardInterface, id?: string): CardInterface => {
  return {
    ...card,
    id,
    faceUp: true,
    attackModifier: 0,
    otherModifier: 0
  }
}