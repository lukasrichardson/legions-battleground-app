import { Document, MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const apply = process.argv.slice(2).includes("--apply");
const collections = ["decks", "published_decks"] as const;

type CardIndex = {
  byId: Map<string, ObjectId>;
  byLegacyId: Map<string, ObjectId | null>;
  byCode: Map<string, ObjectId | null>;
  byTitle: Map<string, ObjectId | null>;
};

type Failure = { collection: string; deckId: string; deckName: string; field: string; index: number; reason: string };
type PlannedUpdate = { collection: typeof collections[number]; id: ObjectId; cards_in_deck: ObjectId[]; side_deck: ObjectId[] };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function addUnique(map: Map<string, ObjectId | null>, key: unknown, id: ObjectId): void {
  if (key === undefined || key === null || key === "") return;
  const normalized = String(key);
  const current = map.get(normalized);
  if (current && !current.equals(id)) map.set(normalized, null);
  else if (!map.has(normalized)) map.set(normalized, id);
}

async function loadCardIndex(client: MongoClient, databaseName: string): Promise<CardIndex> {
  const cards = await client.db(databaseName).collection<Document>("cards")
    .find({}, { projection: { _id: 1, id: 1, card_code: 1, title: 1 } })
    .toArray();
  const index: CardIndex = {
    byId: new Map(),
    byLegacyId: new Map(),
    byCode: new Map(),
    byTitle: new Map(),
  };
  for (const card of cards) {
    if (!(card._id instanceof ObjectId)) continue;
    index.byId.set(card._id.toHexString(), card._id);
    addUnique(index.byLegacyId, card.id, card._id);
    addUnique(index.byCode, card.card_code, card._id);
    addUnique(index.byTitle, card.title, card._id);
  }
  return index;
}

function resolveCard(value: unknown, index: CardIndex): ObjectId | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "entry is not a card document";
  const card = value as Document;
  const embeddedId = card._id;
  if (embeddedId instanceof ObjectId && index.byId.has(embeddedId.toHexString())) return embeddedId;
  if (typeof embeddedId === "string" && ObjectId.isValid(embeddedId)) {
    const match = index.byId.get(embeddedId);
    if (match) return match;
  }

  const candidates: Array<[string, ObjectId | null | undefined]> = [
    ["legacy id", index.byLegacyId.get(String(card.id ?? ""))],
    ["card code", index.byCode.get(String(card.card_code ?? ""))],
    ["title", index.byTitle.get(String(card.title ?? ""))],
  ];
  for (const [source, match] of candidates) {
    if (match instanceof ObjectId) return match;
    if (match === null) return `ambiguous ${source}`;
  }
  return "no matching card";
}

function isObjectIdArray(value: unknown): value is ObjectId[] {
  return Array.isArray(value) && value.every((item) => item instanceof ObjectId);
}

function resolveArray(
  value: unknown,
  index: CardIndex,
  context: Omit<Failure, "field" | "index" | "reason">,
  field: string,
  failures: Failure[],
): ObjectId[] | null {
  if (value === undefined && field === "side_deck") return [];
  if (!Array.isArray(value)) {
    failures.push({ ...context, field, index: -1, reason: "field is not an array" });
    return null;
  }
  const ids: ObjectId[] = [];
  for (const [position, entry] of value.entries()) {
    if (entry instanceof ObjectId) {
      if (index.byId.has(entry.toHexString())) ids.push(entry);
      else failures.push({ ...context, field, index: position, reason: "ObjectId does not exist in cards" });
      continue;
    }
    const resolved = resolveCard(entry, index);
    if (typeof resolved === "string") {
      failures.push({ ...context, field, index: position, reason: resolved });
    } else {
      ids.push(resolved);
    }
  }
  return failures.some((failure) => failure.collection === context.collection && failure.deckId === context.deckId && failure.field === field)
    ? null
    : ids;
}

async function main(): Promise<void> {
  const databaseName = required("MONGO_DB_NAME");
  const client = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  const failures: Failure[] = [];
  const updates: PlannedUpdate[] = [];

  try {
    await client.connect();
    const database = client.db(databaseName);
    const cardIndex = await loadCardIndex(client, databaseName);
    console.log(`Database: ${databaseName}; indexed ${cardIndex.byId.size} catalogue cards.`);

    for (const collectionName of collections) {
      const cursor = database.collection<Document>(collectionName)
        .find({}, { projection: { _id: 1, name: 1, cards_in_deck: 1, side_deck: 1 } })
        .batchSize(100);
      let checked = 0;
      let alreadyMigrated = 0;
      for await (const deck of cursor) {
        checked++;
        if (checked % 1000 === 0) console.log(`${collectionName}: checked ${checked}...`);
        if (!(deck._id instanceof ObjectId)) {
          failures.push({ collection: collectionName, deckId: String(deck._id), deckName: String(deck.name ?? ""), field: "_id", index: -1, reason: "deck _id is not an ObjectId" });
          continue;
        }
        const context = { collection: collectionName, deckId: deck._id.toHexString(), deckName: String(deck.name ?? "") };
        const main = resolveArray(deck.cards_in_deck, cardIndex, context, "cards_in_deck", failures);
        const side = resolveArray(deck.side_deck, cardIndex, context, "side_deck", failures);
        if (!main || !side) continue;
        if (isObjectIdArray(deck.cards_in_deck) && Array.isArray(deck.side_deck) && isObjectIdArray(deck.side_deck)) {
          alreadyMigrated++;
          continue;
        }
        updates.push({ collection: collectionName, id: deck._id, cards_in_deck: main, side_deck: side });
      }
      console.log(`${collectionName}: ${checked} checked, ${alreadyMigrated} already ObjectId-only.`);
    }

    if (failures.length) {
      console.error(`Migration aborted: ${failures.length} unresolved card reference(s). No changes were made.`);
      for (const failure of failures.slice(0, 50)) console.error(JSON.stringify(failure));
      if (failures.length > 50) console.error(`... ${failures.length - 50} additional failure(s)`);
      process.exitCode = 1;
      return;
    }

    console.log(`${updates.length} deck document(s) require conversion.`);
    if (!apply) {
      console.log("Dry run only. Re-run with --apply to write changes.");
      return;
    }

    for (const collectionName of collections) {
      const writes = updates.filter((update) => update.collection === collectionName).map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { cards_in_deck: update.cards_in_deck, side_deck: update.side_deck } },
        },
      }));
      if (!writes.length) continue;
      const result = await database.collection(collectionName).bulkWrite(writes, { ordered: true });
      console.log(`${collectionName}: converted ${result.modifiedCount} document(s).`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Deck card-reference migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
