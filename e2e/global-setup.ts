import { MongoClient, ObjectId } from "mongodb";
import { resolveE2eEnvironment } from "./environment.mjs";

const users = ["e2e-player-one", "e2e-player-two"] as const;

const card = (id: ObjectId, index: number) => ({
  _id: id,
  id: index,
  title: `E2E Warrior ${index}`,
  featured_image: "",
  text: "A deterministic E2E fixture card.",
  content: { paragraphs: [], lines: [], html: "" },
  card_code: `E2E-${index}`,
  card_release: "e2e",
  legion: { names: ["E2E Legion"], slugs: ["e2e-legion"] },
  set: { names: ["E2E Set"], slugs: ["e2e-set"] },
  variant: { names: ["Standard"], slugs: ["standard"] },
  rarity: { names: ["Common"], slugs: ["common"] },
  card_type: { names: ["Warrior"], slugs: ["warrior"] },
  card_subtype: { names: [], slugs: [] },
  card_srl: { names: [], slugs: [] },
  keywords: { names: [], slugs: [] },
  permalink: `e2e-warrior-${index}`,
  attack: 1,
});

export default async function globalSetup() {
  const environment = resolveE2eEnvironment(process.env);
  const client = new MongoClient(environment.MONGO_URL);
  await client.connect();

  try {
    const db = client.db(environment.MONGO_DB_NAME);
    await db.dropDatabase();

    const cards = Array.from({ length: 8 }, (_, index) => card(new ObjectId(), index + 1));
    await db.collection("cards").insertMany(cards);
    const now = new Date();
    const deck = (userId: string, name: string) => ({
      _id: new ObjectId(),
      name,
      subtitle: "E2E fixture deck",
      legion: "E2E Legion",
      userId,
      cards_in_deck: cards.map(({ _id }) => _id),
      side_deck: [], warlords: [], synergies: [], veilRealms: [], guardians: [], tokens: [],
      created_at: now, updated_at: now,
    });
    await db.collection("decks").insertMany(users.map((userId, index) => deck(userId, `E2E Player ${index + 1} Deck`)));
    await db.collection("published_decks").insertOne({
      ...deck("e2e-publisher", "E2E Public Deck"),
      author: "E2E Publisher",
      published_date: now,
    });
    console.log(`[e2e] seeded ${db.databaseName}`);
  } finally {
    await client.close();
  }
}
