import { GameEventPayload, RoomEventPayload } from "../../interfaces/SocketTypes";

interface ValidationResult {
  valid: boolean;
  error?: string;
} 

export default class ValidatorService {
  validateGameEvent(payload: GameEventPayload): ValidationResult {
    if (!payload) return { valid: false, error: 'No payload provided' };
    if (!payload.type) return { valid: false, error: 'Event type is required' };
    return { valid: true };
  };
  
  validateRoomEvent(payload: RoomEventPayload): ValidationResult {
    if (!payload) return { valid: false, error: 'No payload provided' };
    if (!payload.type) return { valid: false, error: 'Event type is required' };
    return { valid: true };
  };
  
  // Simple error handler
  handleError(error: unknown, context: string): string {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  };
}
