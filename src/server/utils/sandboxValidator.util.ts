import { games } from "../game/game";

export const isSandboxActionAllowed = (roomId: string): boolean => {
  return games[roomId]?.sandboxMode;
}

export const validateForSandbox = (roomId: string, normalValidation: () => boolean): boolean => {
  if (isSandboxActionAllowed(roomId)) {
    return true; // Allow all actions in sandbox mode
  }
  return normalValidation(); // Use existing validation in normal mode
}