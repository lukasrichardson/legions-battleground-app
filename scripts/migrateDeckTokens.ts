import { Document, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { CARD_TYPE } from "../src/shared/enums/CardType";

const apply = process.argv.slice(2).includes("--apply");
const collections = ["decks", "published_decks"] as const;
type CollectionName = typeof collections[number];
type Failure = { collection: CollectionName; deckId: string; deckName: string; field: string; index: number; reason: string };
type PlannedUpdate = { collection: CollectionName; id: ObjectId; cards_in_deck: ObjectId[]; tokens: ObjectId[] };

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const isTokenCard = (cardType: unknown): boolean => cardType === CARD_TYPE.TOKEN;

/** Mongo must project the full names array; projecting `names.0` returns an empty array. */
export const cardTypeFromCatalogCard = (card: Document): unknown => card.card_type?.names?.[0];

const sameIds = (left: ObjectId[], right: ObjectId[]): boolean =>
  left.length === right.length && left.every((id, index) => id.equals(right[index]));

const objectIdArray = (
  value: unknown,
  context: Omit<Failure, "field" | "index" | "reason">,
  field: string,
  failures: Failure[],
  missingValue: ObjectId[] | null = null,
): ObjectId[] | null => {
  if (value === undefined) return missingValue;
  if (!Array.isArray(value)) {
    failures.push({ ...context, field, index: -1, reason: "field is not an ObjectId array" });
    return null;
  }
  const ids: ObjectId[] = [];
  for (const [index, item] of value.entries()) {
    if (item instanceof ObjectId) ids.push(item);
    else failures.push({ ...context, field, index, reason: "entry is not an ObjectId" });
  }
  return failures.some((failure) => failure.collection === context.collection && failure.deckId === context.deckId && failure.field === field)
    ? null
    : ids;
};

async function main(): Promise<void> {
  const databaseName = required("MONGO_DB_NAME");
  const client = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  const failures: Failure[] = [];
  const updates: PlannedUpdate[] = [];
  let moved = 0;

  try {
    await client.connect();
    const database = client.db(databaseName);
    const cards = await database.collection<Document>("cards")
      .find({}, { projection: { _id: 1, "card_type.names": 1 } })
      .toArray();
    const typesById = new Map(cards
      .filter((card): card is Document & { _id: ObjectId } => card._id instanceof ObjectId)
      .map((card) => [card._id.toHexString(), cardTypeFromCatalogCard(card)]));
    console.log(`Database: ${databaseName}; indexed ${typesById.size} catalogue cards.`);

    for (const collectionName of collections) {
      let checked = 0;
      let alreadyMigrated = 0;
      const cursor = database.collection<Document>(collectionName).find({}, {
        projection: { _id: 1, name: 1, cards_in_deck: 1, tokens: 1 },
      }).batchSize(100);
      for await (const deck of cursor) {
        checked++;
        if (!(deck._id instanceof ObjectId)) {
          failures.push({ collection: collectionName, deckId: String(deck._id), deckName: String(deck.name ?? ""), field: "_id", index: -1, reason: "deck _id is not an ObjectId" });
          continue;
        }
        const context = { collection: collectionName, deckId: deck._id.toHexString(), deckName: String(deck.name ?? "") };
        const ordinaryCards = objectIdArray(deck.cards_in_deck, context, "cards_in_deck", failures);
        const existingTokens = objectIdArray(deck.tokens, context, "tokens", failures, []);
        if (!ordinaryCards || !existingTokens) continue;

        const nextOrdinary: ObjectId[] = [];
        const nextTokens = [...existingTokens];
        let deckMoved = 0;
        for (const [field, ids] of [["cards_in_deck", ordinaryCards], ["tokens", existingTokens]] as const) {
          for (const [index, id] of ids.entries()) {
            if (!typesById.has(id.toHexString())) {
              failures.push({ ...context, field, index, reason: `card ${id.toHexString()} does not exist in cards` });
              continue;
            }
            const type = typesById.get(id.toHexString());
            if (field === "tokens" && !isTokenCard(type)) {
              failures.push({ ...context, field, index, reason: `card ${id.toHexString()} is not a Token` });
              continue;
            }
            if (field === "cards_in_deck") {
              if (isTokenCard(type)) {
                nextTokens.push(id);
                deckMoved++;
              } else nextOrdinary.push(id);
            }
          }
        }
        if (failures.some((failure) => failure.collection === context.collection && failure.deckId === context.deckId)) continue;
        if (!deckMoved && deck.tokens !== undefined && sameIds(ordinaryCards, nextOrdinary) && sameIds(existingTokens, nextTokens)) {
          alreadyMigrated++;
          continue;
        }
        moved += deckMoved;
        updates.push({ collection: collectionName, id: deck._id, cards_in_deck: nextOrdinary, tokens: nextTokens });
      }
      console.log(`${collectionName}: ${checked} checked, ${alreadyMigrated} already migrated.`);
    }

    if (failures.length) {
      console.error(`Migration aborted: ${failures.length} invalid deck field(s) or card reference(s). No changes were made.`);
      for (const failure of failures.slice(0, 50)) console.error(JSON.stringify(failure));
      if (failures.length > 50) console.error(`... ${failures.length - 50} additional failure(s)`);
      process.exitCode = 1;
      return;
    }

    console.log(`${updates.length} deck document(s) require migration. Tokens moved: ${moved}.`);
    if (!apply) {
      console.log("Dry run only. Re-run with --apply to write changes.");
      return;
    }
    for (const collectionName of collections) {
      const writes = updates.filter((update) => update.collection === collectionName).map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { cards_in_deck: update.cards_in_deck, tokens: update.tokens } },
        },
      }));
      if (!writes.length) continue;
      const result = await database.collection(collectionName).bulkWrite(writes, { ordered: true });
      console.log(`${collectionName}: migrated ${result.modifiedCount} document(s).`);
    }
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Deck token migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
