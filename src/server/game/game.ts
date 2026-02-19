
import GameState from '../interfaces/GameState';
import { GAME_EVENT } from '../enums/GameEvent';
import { conscript } from '../events/cardEvents';
import { goNextPhase, playerInput, rollDie, sendChatMessage, setP1Vieweing, setP2Viewing, setRpsChoice } from '../events/playerEvents';
import { changeP1AP, changeP1Health, changeP2AP, changeP2Health } from '../events/healthApEvents';
import { Server } from 'socket.io';

export const games: {
  [key: string]: GameState["game"]
} = {}

export const users: {
  [key: string]: string
} = {};

export const gameEventMap: {
  [key: string]: (roomId: string, action: unknown, player: { name: string; p1: boolean }, io?: Server) => void
} = {
  [GAME_EVENT.conscript]: conscript,
  //game non cards
  [GAME_EVENT.rollDie]: rollDie,
  [GAME_EVENT.playerInput]: playerInput,
  //migrateed to socket.util.clean
  [GAME_EVENT.sendChatMessage]: sendChatMessage,
  [GAME_EVENT.setP1Viewing]: setP1Vieweing,
  [GAME_EVENT.setP2Viewing]: setP2Viewing,
  [GAME_EVENT.nextPhase]: goNextPhase,
  [GAME_EVENT.setRpsChoice]: setRpsChoice,
  //
  [GAME_EVENT.changeP2Health]: changeP2Health,
  [GAME_EVENT.changeP1Health]: changeP1Health,
  [GAME_EVENT.changeP2AP]: changeP2AP,
  [GAME_EVENT.changeP1AP]: changeP1AP,
}