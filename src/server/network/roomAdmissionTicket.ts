import { createHash, randomBytes } from "node:crypto";

export const ROOM_ADMISSION_COOKIE = "room_admission";
export const ROOM_ADMISSION_TTL_MS = 10 * 60 * 1000;

export interface RoomAdmissionGrant {
  roomId: string;
  playerName: string;
  deckId: string;
  p2DeckId?: string;
  expiresAt: number;
}

const grants = new Map<string, RoomAdmissionGrant>();

const tokenKey = (token: string) => createHash("sha256").update(token).digest("base64url");

export function clearExpiredAdmissionGrants(now = Date.now()): void {
  for (const [key, grant] of grants) {
    if (grant.expiresAt <= now) grants.delete(key);
  }
}

export function issueAdmissionGrant(grant: Omit<RoomAdmissionGrant, "expiresAt">): string {
  clearExpiredAdmissionGrants();
  const token = randomBytes(32).toString("base64url");
  grants.set(tokenKey(token), { ...grant, expiresAt: Date.now() + ROOM_ADMISSION_TTL_MS });
  return token;
}

export function resolveAdmissionGrant(token: string | undefined): RoomAdmissionGrant | null {
  if (!token) return null;
  const key = tokenKey(token);
  const grant = grants.get(key);
  if (!grant || grant.expiresAt <= Date.now()) {
    grants.delete(key);
    return null;
  }
  return grant;
}
