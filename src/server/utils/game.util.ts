import { ObjectId } from "mongodb";
import { DeckResponse } from "../../shared/interfaces/DeckResponse";
import { CardState } from "../../shared/interfaces/CardState";
import { getDatabase } from "./database.util";
import { games } from "../game/game";
import { generateStartingPlayersCards } from "./generateCards.util";
import { addGameLog } from "./generateGameLog";
import { CARD_TARGET } from "../../shared/enums/CardTarget";
import { SequenceItem, StepType } from "../interfaces/SequenceInterfaces";
import { GamePhase, PreGamePhase } from "../../shared/enums/Phases";
import { MoveCardActionInterface, moveCard, plunder } from "../events/cardEvents";
import { goNextPhase } from "../events/playerEvents";
import {ALL_KEYWORDS, KeywordTrigger} from "../cards/Keywords";
import { Server } from "socket.io";
import axios from "axios";

export const STARTING_HAND_SIZE = 6;

export const fetchToolboxDeckById = async ({ deckId }: { deckId: string }) => {
  try {
    const response = await axios.get(`https://legionstoolbox.com/index.php/wp-json/lraw/v1/decks?deck=${deckId}`, {
      headers: {
        'User-Agent': 'Legions-Battleground-Server/1.0.0',
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
      },
      timeout: 10000 // 10 second timeout
    });

    // Handle both 200 and 202 status codes
    if (response.status === 200 || response.status === 202) {
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`No deck data returned for deck ID ${deckId}. Response: ${JSON.stringify(response.data)}`);
      }
      
      const deck: DeckResponse = { ...response.data[0].data, id: deckId };
      return deck;
    } else {
      throw new Error(`Unexpected status code: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching toolbox deck:", {
      deckId,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      environment: process.env.NODE_ENV || 'development'
    });
    throw error;
  }
}

export const fetchPlayerDeckById = async ({ deckId }: { deckId: string }) => {
  try {
    const db = getDatabase();
    const deck = await db.collection<DeckResponse>("decks").findOne({ _id: new ObjectId(deckId) });
    
    if (!deck) {
      throw new Error(`Deck with ID ${deckId} not found in database`);
    }
    
    return deck;
  } catch (error) {
    console.error('Error fetching deck %s from MongoDB:', deckId, error);
    throw error;
  }
}

export const fetchInitialDecks = async (deckId: string, p2DeckId?: string) => {
  console.log(`Fetching initial decks. P1 deck ID: ${deckId}, P2 deck ID: ${p2DeckId}`);
  const p2DeckIdFinal = p2DeckId || deckId;
  const p2Deck = await fetchPlayerDeckById({ deckId: p2DeckIdFinal });
  const p1Deck = await fetchPlayerDeckById({ deckId });
  return { p2Deck, p1Deck };
}

export const resetPlayersCards = (room: string, p1DeckResponse: DeckResponse, p2DeckResponse: DeckResponse) => {
  const {
    p2Deck, p1Deck
  } = generateStartingPlayersCards(p2DeckResponse as DeckResponse, p1DeckResponse as DeckResponse);
  const {
    playerHand: p2PlayerHand,
    playerDeck: p2PlayerDeck,
    warlord: p2PlayerWarlord,
    veilRealm: p2PlayerVeilRealm,
    guardian: p2PlayerGuardian,
    synergy: p2PlayerSynergy,
    discard: p2PlayerDiscard,
    eradication: p2PlayerEradication,
    fortifieds: p2PlayerFortifieds,
    unifieds: p2PlayerUnifieds,
    warriors: p2PlayerWarriors,
    tokens: p2PlayerTokens,
    revealed: p2Revealed

  } = p2Deck;
  const {
    playerHand: p1PlayerHand,
    playerDeck: p1PlayerDeck,
    warlord: p1PlayerWarlord,
    veilRealm: p1PlayerVeilRealm,
    guardian: p1PlayerGuardian,
    synergy: p1PlayerSynergy,
    discard: p1PlayerDiscard,
    eradication: p1PlayerEradication,
    fortifieds: p1PlayerFortifieds,
    unifieds: p1PlayerUnifieds,
    warriors: p1PlayerWarriors,
    tokens: p1PlayerTokens,
    revealed: p1Revealed
  } = p1Deck;
  games[room].p2PlayerHand = p2PlayerHand;
  games[room].p2PlayerDeck = p2PlayerDeck;
  games[room].p2PlayerWarlord = p2PlayerWarlord;
  games[room].p2PlayerVeilRealm = p2PlayerVeilRealm;
  games[room].p2PlayerGuardian = p2PlayerGuardian;
  games[room].p2PlayerSynergy = p2PlayerSynergy;
  games[room].p2PlayerDiscard = p2PlayerDiscard;
  games[room].p2PlayerEradication = p2PlayerEradication;
  games[room].p2PlayerFortifieds = p2PlayerFortifieds;
  games[room].p2PlayerUnifieds = p2PlayerUnifieds;
  games[room].p2PlayerWarriors = p2PlayerWarriors;
  games[room].p2PlayerTokens = p2PlayerTokens;
  games[room].p2PlayerRevealed = p2Revealed;

  games[room].p1PlayerHand = p1PlayerHand;
  games[room].p1PlayerDeck = p1PlayerDeck;
  games[room].p1PlayerWarlord = p1PlayerWarlord;
  games[room].p1PlayerVeilRealm = p1PlayerVeilRealm;
  games[room].p1PlayerGuardian = p1PlayerGuardian;
  games[room].p1PlayerSynergy = p1PlayerSynergy;
  games[room].p1PlayerDiscard = p1PlayerDiscard;
  games[room].p1PlayerEradication = p1PlayerEradication;
  games[room].p1PlayerFortifieds = p1PlayerFortifieds;
  games[room].p1PlayerUnifieds = p1PlayerUnifieds;
  games[room].p1PlayerWarriors = p1PlayerWarriors;
  games[room].p1PlayerTokens = p1PlayerTokens;
  games[room].p1PlayerRevealed = p1Revealed;
}

export const setDeck = async (roomId: string, deckId: string, p1: boolean) => {
  if (p1) {
    if (games[roomId].p1DeckFromServer?.id === deckId) return;
    games[roomId].p1DeckFromServer = await fetchPlayerDeckById({ deckId });
  } else {
    if (games[roomId].p2DeckFromServer?.id === deckId) return;
    games[roomId].p2DeckFromServer = await fetchPlayerDeckById({ deckId });
  }
  // dont reset game on set deck temporary
  // await resetGame(roomId);
}

export const drawCardP1 = (roomId: string, player: { name: string; p1: boolean }, index = 0) => {
  const cardToMove = games[roomId].p1PlayerDeck[index];
  moveCard(roomId, {
    id: cardToMove.id,
    from: {target: CARD_TARGET.P1_PLAYER_DECK, targetIndex: index},
    target: CARD_TARGET.P1_PLAYER_HAND
  },
    player as { name: string; p1: boolean },
    null,
    false
  );
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, `(P1 ` + "drew a card.");
}
export const drawCardP2 = (roomId: string, player: { name: string; p1: boolean }, index = 0) => {
  const cardToMove = games[roomId].p2PlayerDeck[index];
  moveCard(roomId, {
    id: cardToMove.id,
    from: {target: CARD_TARGET.P2_PLAYER_DECK, targetIndex: index},
    target: CARD_TARGET.P2_PLAYER_HAND
  },
    player as { name: string; p1: boolean },
    null,
    false
  );
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, `(P2 ` + "drew a card.");
}

export const p1WinsRPS = (roomId: string, io: Server) => {
  games[roomId].rpsWinner = "p1";
  goNextPhase(roomId, {}, {}, io);
}
export const p2WinsRPS = (roomId: string, io: Server) => {
  games[roomId].rpsWinner = "p2";
  goNextPhase(roomId, {}, {}, io);
}

export const addSequenceItem = (roomId: string, payload: SequenceItem) => {
  if (!games[roomId]?.sequences?.length) {
    games[roomId].sequences.push({ items: [payload] });
  } else games[roomId].sequences[games[roomId].sequences.length - 1].items.push(payload);
}

export const resolveFirstItemInSequence = (roomId: string, io: Server) => {
  if (!games[roomId]?.sequences?.length) {
    return;
  }

  if (!games[roomId].resolving) {
    games[roomId].resolving = true;
  } else {

  }
  
  const firstSequence = games[roomId].sequences[0];
  if (firstSequence.items.length > 0) {
    const sequenceItemToResolve = firstSequence.items[0];
    let selected = null;
    for (const effect of sequenceItemToResolve?.effect) {
      switch (effect.type) {
        case StepType.ChooseCards:
          if (games[roomId].sandboxMode && (effect.waitingForInput?.p1 || effect.waitingForInput?.p2 || effect.waitingForInput?.controller)) {
            effect.waitingForInput = undefined;
            effect.selected = [];
          } else if (effect.waitingForInput?.p1 || effect.waitingForInput?.p2 || effect.waitingForInput?.controller) {
            return emitCurrentState(roomId, io);
          }
          
          if (effect.selected) {
            selected = effect.selected;
          }
          break;
        case StepType.MoveCard:
          if (effect?.quantity === "selected") {
            if (selected && selected.length) {
              selected.forEach(() => {
                if (effect.from[0].target === CARD_TARGET.P1_PLAYER_DECK && effect.from.length === 1 && effect.to[0].target === CARD_TARGET.P1_PLAYER_HAND) {
                  drawCardP1(roomId, { name: "P1", p1: true });
                } else if (effect.from[0].target === CARD_TARGET.P2_PLAYER_DECK && effect.from.length === 1 && effect.to[0].target === CARD_TARGET.P2_PLAYER_HAND) {
                  drawCardP2(roomId, { name: "P2", p1: false });
                }
              });
            }
          } else if (selected && selected.length) {
            selected.forEach((action: MoveCardActionInterface) => {
              moveCard(roomId, {
                id: action.id,
                from: action.from,
                target: action.target,
                targetIndex: action.targetIndex,
                bottom: true
              }, { name: "Game Engine", p1: false }, io, false);
            });

          }
          break;
        case StepType.Conscript:
          games[roomId].playerConscripted = true;
          if (selected && selected.length) {
            selected.forEach((action: MoveCardActionInterface) => {
              action.keywords?.forEach((keyword) => {
                if (ALL_KEYWORDS[keyword].sequenceItem) {
                  if (ALL_KEYWORDS[keyword].triggers.includes(KeywordTrigger.ETB)){
                    if (ALL_KEYWORDS[keyword].conditions?.length){
                      if ((games[roomId][ALL_KEYWORDS[keyword].conditions[0].target] as CardState[])?.length >= ALL_KEYWORDS[keyword].conditions[0].minSize) {
                        addSequenceItem(roomId, ALL_KEYWORDS[keyword].sequenceItem);
                      }
                    }
                  }
                }
              });
            });
          }
          break;
        case StepType.DrawCard:
          if (effect.random && typeof effect.quantity === "number") {
            for (let i = 0 ; i < effect.quantity; i++) {
              const p1 = effect.from[0].target === CARD_TARGET.P1_PLAYER_DECK;
              const max = p1 ? games[roomId].p1PlayerDeck.length : games[roomId].p2PlayerDeck.length;
              const randomIndex = Math.floor(Math.random() * max);
              plunder(roomId, {number: randomIndex}, { name: "Game Engine", p1: !!p1 });
            }
          } else if ( typeof effect.quantity === "number" && effect.quantity > 0) {
            for (let i = 0; i < effect.quantity; i++) {
              if (effect.from[0].target === CARD_TARGET.P1_PLAYER_DECK) {
                drawCardP1(roomId, { name: "P1", p1: true });
              } else if (effect.from[0].target === CARD_TARGET.P2_PLAYER_DECK) {
                drawCardP2(roomId, { name: "P2", p1: false });
              }
            }
            // tbd
          }
        default:
          break;
      }
    }
    
    firstSequence.items.shift();
    if (firstSequence.items.length === 0) {
      games[roomId].sequences.shift();
      if (games[roomId].sequences.length === 0) {
        games[roomId].resolving = false;
        if (games[roomId].currentPhase === PreGamePhase.P1Guardian || games[roomId].currentPhase === PreGamePhase.P2Guardian || games[roomId].currentPhase === GamePhase.P1Countdown || games[roomId].currentPhase === GamePhase.P2Countdown) {
          goNextPhase(roomId, {}, {}, io);
        }
      } else {
        resolveFirstItemInSequence(roomId, io);
      }
    } else {
      resolveFirstItemInSequence(roomId, io);
    }
  } else {
    games[roomId].sequences.shift();
  }
  emitCurrentState(roomId, io);
  
}

export const emitCurrentState = (roomId: string, io: Server) => {
  io.to(roomId).emit("phaseEvent", { type: null, data: games[roomId] });
  io.to(roomId).emit("gameEvent", { type: null, data: games[roomId] });
}