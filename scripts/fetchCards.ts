import axios from "axios";
import { S3Client } from "@aws-sdk/client-s3";
import { MongoClient, ServerApiVersion } from "mongodb";
import {
  findObjectKeyCollisions,
  mapWithConcurrency,
  syncImage,
  toPublicR2Url,
  toR2ObjectKey,
} from "../src/server/utils/r2CardImageSync";
import { mapToolboxCard, type ToolboxCard } from "../src/server/utils/toolboxCardImport";

const TOOLBOX_CARDS_URL = "https://api.legionstoolbox.com/index.php/wp-json/lraw/v1/cards/get-cards";
const IMAGE_SYNC_CONCURRENCY = 5;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function syncNewCardImages(cards: ToolboxCard[]): Promise<Map<string, string>> {
  const sourceUrls = [...new Set(cards.map((card) => card.thumb))];
  const invalidUrls = sourceUrls.filter((sourceUrl) => !toR2ObjectKey(sourceUrl));
  if (invalidUrls.length) {
    throw new Error(`New cards have invalid Toolbox image URLs:\n${invalidUrls.join("\n")}`);
  }

  const collisions = findObjectKeyCollisions(sourceUrls);
  if (collisions.size) {
    const details = [...collisions].map(([key, urls]) => `${key}: ${urls.join(", ")}`).join("\n");
    throw new Error(`Refusing to overwrite colliding image filenames:\n${details}`);
  }

  // Validate every setting before creating an external side effect.
  const bucket = required("R2_BUCKET");
  const publicBaseUrl = required("R2_PUBLIC_BASE_URL");
  const client = createR2Client();
  const results = await mapWithConcurrency(sourceUrls, IMAGE_SYNC_CONCURRENCY, (sourceUrl) =>
    syncImage(sourceUrl, {
      bucket,
      client,
      dryRun: false,
      refresh: false,
    }),
  );
  const failed = results.filter((result) => result.status !== "uploaded" && result.status !== "skipped");
  if (failed.length) {
    throw new Error(`Could not prepare all R2 images:\n${failed.map((result) => `${result.sourceUrl}: ${result.reason || result.status}`).join("\n")}`);
  }

  return new Map(results.map((result) => [
    result.sourceUrl,
    toPublicR2Url(publicBaseUrl, result.objectKey!),
  ]));
}

async function main() {
  const mongoClient = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  try {
    await mongoClient.connect();
    await mongoClient.db("admin").command({ ping: 1 });
    const database = mongoClient.db(required("MONGO_DB_NAME"));

    const response = await axios.get<ToolboxCard[]>(TOOLBOX_CARDS_URL, { timeout: 30_000 });
    if (!Array.isArray(response.data)) throw new Error("Toolbox cards response was not an array");

    const sourceCards = response.data;
    const sourceIds = sourceCards.map((card) => card.id);
    const existingCards = await database.collection("cards")
      .find({ id: { $in: sourceIds } })
      .project<{ id: ToolboxCard["id"] }>({ id: 1 })
      .toArray();
    const existingIds = new Set(existingCards.map((card) => card.id));
    const newCards = sourceCards.filter((card) => !existingIds.has(card.id));

    if (!newCards.length) {
      console.log(`Finished processing cards. Skipped: ${sourceCards.length}, Inserted: 0`);
      return;
    }

    // Mongo is written only after every new card image has been confirmed in R2.
    const r2UrlsBySourceUrl = await syncNewCardImages(newCards);
    const documents = newCards.map((card) => {
      const featuredImageUrl = r2UrlsBySourceUrl.get(card.thumb);
      if (!featuredImageUrl) throw new Error(`R2 URL missing for Toolbox image: ${card.thumb}`);
      return mapToolboxCard(card, featuredImageUrl);
    });
    await database.collection("cards").insertMany(documents, { ordered: true });
    console.log(`Finished processing cards. Skipped: ${existingIds.size}, Inserted: ${documents.length}`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error("Card import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
