import { MongoClient, ObjectId } from "mongodb";
import { resolveE2eEnvironment } from "./environment.mjs";

const users = ["e2e-player-one", "e2e-player-two"] as const;

const warriorImageKeys = [
  "cards/Asteria-Mystic-Primordial-Sorceress.png",
  "cards/Raginmund-The-Last-Ashborne-Dragon.png",
  "cards/Raylene-Frozen-Arcane-Defender.png",
  "cards/The-Mystic-Druid-Heroes-Hood.png",
  "cards/Alexandria-Purifier-Of-The-Heavens.png",
  "cards/MegSaria-Grimm-Vizier-Of-The-Vault.png",
  "cards/Visceria-Emissary-Of-The-Disciples.png",
  "cards/Vendetta-Paradises-Gatekeeper.png",
] as const;

const cardImageUrl = (baseUrl: string, objectKey: string) =>
  new URL(objectKey, baseUrl).toString();

const card = (id: ObjectId, index: number, imageBaseUrl: string) => ({
  _id: id,
  id: index,
  title: `E2E Warrior ${index}`,
  featured_image: cardImageUrl(imageBaseUrl, warriorImageKeys[index - 1]),
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

const visualCard = (id: ObjectId, numericId: number, title: string, code: string, type: string, imageBaseUrl: string, imageKey: string) => ({
  _id: id,
  id: numericId,
  title,
  featured_image: cardImageUrl(imageBaseUrl, imageKey),
  text: "A production-art fixture used for deterministic battlefield visual QA.",
  content: { paragraphs: [], lines: [], html: "" },
  card_code: code,
  card_release: "e2e-visual",
  legion: { names: ["E2E Legion"], slugs: ["e2e-legion"] },
  set: { names: ["E2E Visual Set"], slugs: ["e2e-visual-set"] },
  variant: { names: ["Standard"], slugs: ["standard"] },
  rarity: { names: ["Rare"], slugs: ["rare"] },
  card_type: { names: [type], slugs: [type.toLowerCase().replaceAll(" ", "-")] },
  card_subtype: { names: [], slugs: [] },
  card_srl: { names: [], slugs: [] },
  keywords: { names: [], slugs: [] },
  permalink: `e2e-${code.toLowerCase()}`,
});

export default async function globalSetup() {
  const environment = resolveE2eEnvironment(process.env);
  const imageBaseUrl = environment.E2E_CARD_IMAGE_BASE_URL;
  const client = new MongoClient(environment.MONGO_URL);
  await client.connect();

  try {
    const db = client.db(environment.MONGO_DB_NAME);
    await db.dropDatabase();

    const cards = Array.from({ length: 8 }, (_, index) =>
      card(new ObjectId(), index + 1, imageBaseUrl),
    );
    const visualCards = {
      unified: visualCard(new ObjectId(), 101, "E2E Reading the Arcane Runes", "VIS-U", "Unified", imageBaseUrl, "cards/WW25-046.png"),
      fortified: visualCard(new ObjectId(), 102, "E2E Amaranthine Devotion", "VIS-F", "Fortified", imageBaseUrl, "cards/Amaranthine-Devotion.png"),
      warlord: visualCard(new ObjectId(), 103, "E2E Xenora", "VIS-WL", "Warlord", imageBaseUrl, "cards/Xenora.png"),
      guardian: visualCard(new ObjectId(), 104, "E2E Atlas", "VIS-G", "Guardian", imageBaseUrl, "cards/WW25_084.png"),
      veilRealm: visualCard(new ObjectId(), 105, "E2E Veil and Realm", "VIS-VR", "Veil / Realm", imageBaseUrl, "cards/SEM_SD02.png"),
      synergy: visualCard(new ObjectId(), 106, "E2E Monument of Peace", "VIS-S", "Synergy", imageBaseUrl, "cards/WW25_076.png"),
      token: visualCard(new ObjectId(), 107, "E2E Sapphire Liger", "VIS-T", "Token", imageBaseUrl, "cards/SEM_SD00.png"),
    };
    await db.collection("cards").insertMany([...cards, ...Object.values(visualCards)]);
    const now = new Date();
    const deck = (userId: string, name: string, overrides: Record<string, unknown> = {}) => ({
      _id: new ObjectId(),
      name,
      subtitle: "E2E fixture deck",
      legion: "E2E Legion",
      userId,
      cards_in_deck: cards.map(({ _id }) => _id),
      side_deck: [],
      warlords: [],
      synergies: [],
      veilRealms: [],
      guardians: [],
      tokens: [],
      created_at: now,
      updated_at: now,
      ...overrides,
    });
    const visualMainDeck = Array.from({ length: 45 }, (_, index) => {
      const mainCards = [...cards, visualCards.unified, visualCards.fortified];
      return mainCards[index % mainCards.length]._id;
    });
    await db.collection("decks").insertOne(deck("e2e-player-one", "E2E Production Visual Deck", {
      subtitle: "Production-art battlefield fixture",
      cards_in_deck: visualMainDeck,
      warlords: [visualCards.warlord._id],
      synergies: [visualCards.synergy._id],
      veilRealms: [visualCards.veilRealm._id],
      guardians: [visualCards.guardian._id],
      tokens: [visualCards.token._id],
    }));
    await db
      .collection("decks")
      .insertMany(
        users.map((userId, index) =>
          deck(userId, `E2E Player ${index + 1} Deck`),
        ),
      );
    await db.collection("published_decks").insertOne({
      ...deck("e2e-publisher", "E2E Public Deck"),
      cards_in_deck: [
        cards[0]._id,
        cards[0]._id,
        ...cards.slice(1).map(({ _id }) => _id),
      ],
      author: "E2E Publisher",
      published_date: now,
    });
    console.log(`[e2e] seeded ${db.databaseName}`);
  } finally {
    await client.close();
  }
}
