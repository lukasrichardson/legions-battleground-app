
import { GameStateData } from '@/shared/interfaces/GameState';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { conscript } from '../events/cardEvents';
import { goNextPhase, playerInput, setRpsChoice } from '../events/playerEvents';
import { Server } from 'socket.io';

export const games: {
  [key: string]: GameStateData
} = {}

export const users: {
  [key: string]: string
} = {};

export const gameEventMap: {
  [key: string]: (roomId: string, action: unknown, player: { name: string; p1: boolean }, io?: Server) => void
} = {
  [GAME_EVENT.conscript]: conscript,
  //game non cards
  [GAME_EVENT.playerInput]: playerInput,
  //migrateed to socket.util.clean
  [GAME_EVENT.nextPhase]: goNextPhase,
  [GAME_EVENT.setRpsChoice]: setRpsChoice,
  //
}