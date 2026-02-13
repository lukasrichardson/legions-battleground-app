import { GameEventPayload, JoinGamePayload, RoomEventPayload } from "../interfaces/SocketTypes";

// Simple validation utilities
export const validateJoinGame = (data: JoinGamePayload): { valid: boolean; error?: string } => {
  if (!data) return { valid: false, error: 'No data provided' };
  if (!data.roomName || typeof data.roomName !== 'string') {
    return { valid: false, error: 'Room name is required' };
  }
  if (!data.playerName || typeof data.playerName !== 'string') {
    return { valid: false, error: 'Player name is required' };
  }
  if (!data.deckId || typeof data.deckId !== 'string') {
    return { valid: false, error: 'Deck ID is required' };
  }
  return { valid: true };
};

export const validateGameEvent = (payload: GameEventPayload): { valid: boolean; error?: string } => {
  if (!payload) return { valid: false, error: 'No payload provided' };
  if (!payload.type) return { valid: false, error: 'Event type is required' };
  return { valid: true };
};

export const validateRoomEvent = (payload: RoomEventPayload): { valid: boolean; error?: string } => {
  if (!payload) return { valid: false, error: 'No payload provided' };
  if (!payload.type) return { valid: false, error: 'Event type is required' };
  return { valid: true };
};

// Simple error handler
export const handleError = (error: unknown, context: string): string => {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};