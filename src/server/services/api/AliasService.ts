import { MongoServerError } from "mongodb";
import { getDatabase } from "@/server/utils/database.util";

const MIN_ALIAS_LENGTH = 3;
const MAX_ALIAS_LENGTH = 24;
const ALIAS_PATTERN = /^[A-Za-z0-9_-]+$/;

export type AliasProfile = {
  userId: string;
  alias: string;
  aliasKey: string;
  updatedAt: Date;
};

export class AliasValidationError extends Error {}
export class AliasTakenError extends Error {}

export function normalizeAlias(value: unknown): { alias: string; aliasKey: string } {
  if (typeof value !== "string") {
    throw new AliasValidationError("Username is required.");
  }

  const alias = value.trim();
  if (alias.length < MIN_ALIAS_LENGTH || alias.length > MAX_ALIAS_LENGTH) {
    throw new AliasValidationError(`Username must be ${MIN_ALIAS_LENGTH}-${MAX_ALIAS_LENGTH} characters long.`);
  }
  if (!ALIAS_PATTERN.test(alias)) {
    throw new AliasValidationError("Username may contain only letters, numbers, hyphens, and underscores.");
  }

  return { alias, aliasKey: alias.toLowerCase() };
}

export async function getAliasForUser(userId: string): Promise<string | null> {
  const profile = await getDatabase().collection<AliasProfile>("user_profiles").findOne({ userId });
  return profile?.alias ?? null;
}

export async function setAliasForUser(userId: string, value: unknown): Promise<string> {
  const { alias, aliasKey } = normalizeAlias(value);
  const profiles = getDatabase().collection<AliasProfile>("user_profiles");

  try {
    await profiles.updateOne(
      { userId },
      { $set: { alias, aliasKey, updatedAt: new Date() }, $setOnInsert: { userId } },
      { upsert: true },
    );
    await getDatabase().collection("published_decks").updateMany(
      { userId },
      { $set: { author: alias } },
    );
    return alias;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new AliasTakenError("That Battleground username is already taken.");
    }
    throw error;
  }
}

export async function deleteAliasForUser(userId: string, fallbackPublicName: string): Promise<void> {
  const database = getDatabase();
  await database.collection<AliasProfile>("user_profiles").deleteOne({ userId });
  await database.collection("published_decks").updateMany(
    { userId },
    { $set: { author: fallbackPublicName } },
  );
}

export async function ensureAliasIndexes(): Promise<void> {
  const profiles = getDatabase().collection<AliasProfile>("user_profiles");
  await Promise.all([
    profiles.createIndex({ userId: 1 }, { unique: true }),
    profiles.createIndex({ aliasKey: 1 }, { unique: true }),
  ]);
}
