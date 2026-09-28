import { Document, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { CARD_TYPE } from "../src/shared/enums/CardType";

const apply = process.argv.slice(2).includes("--apply");
const collections = ["decks", "published_decks"] as const;
const specialFields = ["warlords", "synergies", "veilRealms", "guardians"] as const;
type CollectionName = typeof collections[number];
type SpecialField = typeof specialFields[number];
type Failure = { collection: CollectionName; deckId: string; deckName: string; field: string; index: number; reason: string };
type PlannedUpdate = { collection: CollectionName; id: ObjectId; cards_in_deck: ObjectId[] } & Record<SpecialField, ObjectId[]>;

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const specialFieldForCardType = (cardType: unknown): SpecialField | null => {
  if (cardType === CARD_TYPE.WARLORD) return "warlords";
  if (cardType === CARD_TYPE.SYNERGY) return "synergies";
  if (cardType === CARD_TYPE.VEIL_REALM) return "veilRealms";
  if (cardType === CARD_TYPE.GUARDIAN) return "guardians";
  return null;
};

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
  for (const [index, valueAtIndex] of value.entries()) {
    if (valueAtIndex instanceof ObjectId) ids.push(valueAtIndex);
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
  const moved: Record<SpecialField, number> = { warlords: 0, synergies: 0, veilRealms: 0, guardians: 0 };

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
        projection: { _id: 1, name: 1, cards_in_deck: 1, warlords: 1, synergies: 1, veilRealms: 1, guardians: 1 },
      }).batchSize(100);
      for await (const deck of cursor) {
        checked++;
        if (!(deck._id instanceof ObjectId)) {
          failures.push({ collection: collectionName, deckId: String(deck._id), deckName: String(deck.name ?? ""), field: "_id", index: -1, reason: "deck _id is not an ObjectId" });
          continue;
        }
        const context = { collection: collectionName, deckId: deck._id.toHexString(), deckName: String(deck.name ?? "") };
        const ordinaryCards = objectIdArray(deck.cards_in_deck, context, "cards_in_deck", failures);
        const currentSpecial = Object.fromEntries(specialFields.map((field) => [field, objectIdArray(deck[field], context, field, failures, [])])) as Record<SpecialField, ObjectId[] | null>;
        if (!ordinaryCards || specialFields.some((field) => !currentSpecial[field])) continue;

        const nextSpecial = Object.fromEntries(specialFields.map((field) => [field, [...currentSpecial[field]!]])) as Record<SpecialField, ObjectId[]>;
        const nextOrdinary: ObjectId[] = [];
        let deckMoved = false;
        const deckMovedCounts: Record<SpecialField, number> = { warlords: 0, synergies: 0, veilRealms: 0, guardians: 0 };
        for (const [index, id] of ordinaryCards.entries()) {
          if (!typesById.has(id.toHexString())) {
            failures.push({ ...context, field: "cards_in_deck", index, reason: `card ${id.toHexString()} does not exist in cards` });
            continue;
          }
          const cardType = typesById.get(id.toHexString());
          const field = specialFieldForCardType(cardType);
          if (field) {
            nextSpecial[field].push(id);
            deckMovedCounts[field]++;
            deckMoved = true;
          } else nextOrdinary.push(id);
        }
        if (failures.some((failure) => failure.collection === context.collection && failure.deckId === context.deckId)) continue;
        for (const field of specialFields) moved[field] += deckMovedCounts[field];
        const missingSpecialField = specialFields.some((field) => deck[field] === undefined);
        if (!deckMoved && !missingSpecialField && sameIds(ordinaryCards, deck.cards_in_deck) && specialFields.every((field) => sameIds(nextSpecial[field], currentSpecial[field]!))) {
          alreadyMigrated++;
          continue;
        }
        updates.push({ collection: collectionName, id: deck._id, cards_in_deck: nextOrdinary, ...nextSpecial });
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

    console.log(`${updates.length} deck document(s) require migration. Moved: ${JSON.stringify(moved)}.`);
    if (!apply) {
      console.log("Dry run only. Re-run with --apply to write changes.");
      return;
    }
    for (const collectionName of collections) {
      const writes = updates.filter((update) => update.collection === collectionName).map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { cards_in_deck: update.cards_in_deck, warlords: update.warlords, synergies: update.synergies, veilRealms: update.veilRealms, guardians: update.guardians } },
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
    console.error("Deck special-card migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
