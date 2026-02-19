import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "../../shared/interfaces/CardState";
import { games } from "../game/game";

export function removeCardFromZone(
  target: CARD_TARGET,
  roomId: string,
  cardId: string,
  targetIndex?: number
): CardState | null {
  if (Array.isArray(games[roomId][target][0])) {
    // Array of arrays (e.g., fortified, unified, warrior)
    if (targetIndex === undefined) return null;
    const column = games[roomId][target][targetIndex];
    const cardIdx = column.findIndex((c: CardState) => c.id === cardId);
    if (cardIdx === -1) return null;
    const [removed] = column.splice(cardIdx, 1);
    return removed || null;
  } else {
    // Simple array (e.g., hand, deck)
    const cardIdx = (games[roomId][target] as CardState[]).findIndex((c: CardState) => c.id === cardId);
    if (cardIdx === -1) return null;
    const [removed] = (games[roomId][target] as CardState[]).splice(cardIdx, 1);
    return removed || null;
  }
}

export function addCardToZone(
  target: CARD_TARGET,
  roomId: string,
  card: CardState,
  targetIndex?: number,
  bottom: boolean = false
) {
  if (Array.isArray(games[roomId][target][0])) {
    // Array of arrays
    if (targetIndex === undefined) return;
    if (bottom) {
      games[roomId][target][targetIndex].unshift(card);
    } else {
      games[roomId][target][targetIndex].push(card);
    }
  } else {
    // Simple array
    if (bottom) {
      (games[roomId][target] as CardState[]).unshift(card);
    } else {
      (games[roomId][target] as CardState[]).push(card);
    }
  }
}

