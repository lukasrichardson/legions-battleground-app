import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_VERSION = "v1";
const KEY_LENGTH = 64;

export function passwordOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function hashRoomPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `${HASH_VERSION}:${salt}:${derived.toString("base64url")}`;
}

export async function matchesRoomPassword(storedHash: string | undefined, supplied: unknown): Promise<boolean> {
  if (!storedHash) return true;
  if (typeof supplied !== "string" || supplied.length === 0) return false;

  const [version, salt, encodedExpected] = storedHash.split(":");
  if (version !== HASH_VERSION || !salt || !encodedExpected) return false;

  const expected = Buffer.from(encodedExpected, "base64url");
  const actual = await scrypt(supplied, salt, expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
