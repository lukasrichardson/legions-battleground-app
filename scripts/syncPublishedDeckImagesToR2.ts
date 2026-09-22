import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MongoClient, ServerApiVersion, type Document } from "mongodb";
import { toPublicR2Url, toR2ObjectKey } from "../src/server/utils/r2CardImageSync";

type CliOptions = { apply: boolean; report?: string };

type SyncReport = {
  generatedAt: string;
  apply: boolean;
  matchingDecks: number;
  matchingCards: number;
  updates: Array<{ deckId: string; sourceUrl: string; r2Url: string }>;
  unsupportedUrls: Array<{ deckId: string; url: string }>;
};

function readOptions(args: string[]): CliOptions {
  const reportIndex = args.indexOf("--report");
  return {
    apply: args.includes("--apply"),
    report: reportIndex === -1 ? undefined : args[reportIndex + 1],
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isToolboxUrl(value: unknown): value is string {
  return typeof value === "string" && /^https:\/\/(api\.)?legionstoolbox\.com\//.test(value);
}

async function writeReport(report: SyncReport, reportPath?: string): Promise<string> {
  const path = reportPath || join(
    ".published-deck-image-sync",
    `report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}

async function main() {
  const options = readOptions(process.argv.slice(2));
  const mongoClient = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  const publicBaseUrl = required("R2_PUBLIC_BASE_URL");
  const report: SyncReport = {
    generatedAt: new Date().toISOString(),
    apply: options.apply,
    matchingDecks: 0,
    matchingCards: 0,
    updates: [],
    unsupportedUrls: [],
  };

  try {
    await mongoClient.connect();
    const database = mongoClient.db(required("MONGO_DB_NAME"));
    const publishedDecks = database.collection<Document>("published_decks");
    const decks = await publishedDecks.find(
      { "cards_in_deck.featured_image": /^https:\/\/(api\.)?legionstoolbox\.com\// },
      { projection: { _id: 1, cards_in_deck: 1 } },
    ).toArray();

    for (const deck of decks) {
      const deckId = String(deck._id);
      const sourceUrls = new Set<string>();
      for (const card of Array.isArray(deck.cards_in_deck) ? deck.cards_in_deck : []) {
        if (!isToolboxUrl(card?.featured_image)) continue;
        const objectKey = toR2ObjectKey(card.featured_image);
        if (!objectKey) {
          report.unsupportedUrls.push({ deckId, url: card.featured_image });
          continue;
        }
        report.matchingCards += 1;
        sourceUrls.add(card.featured_image);
      }
      if (sourceUrls.size) report.matchingDecks += 1;
      for (const sourceUrl of sourceUrls) {
        report.updates.push({
          deckId,
          sourceUrl,
          r2Url: toPublicR2Url(publicBaseUrl, toR2ObjectKey(sourceUrl)!),
        });
      }
    }

    console.log(`${options.apply ? "Syncing" : "Dry run for"} ${report.matchingCards} card images across ${report.matchingDecks} published decks.`);
    if (options.apply && report.updates.length && !report.unsupportedUrls.length) {
      const deckIds = new Map(decks.map((deck) => [String(deck._id), deck._id]));
      const writes = report.updates.map(({ deckId, sourceUrl, r2Url }) => ({
        updateOne: {
          filter: { _id: deckIds.get(deckId) },
          update: { $set: { "cards_in_deck.$[card].featured_image": r2Url } },
          arrayFilters: [{ "card.featured_image": sourceUrl }],
        },
      }));
      const result = await publishedDecks.bulkWrite(writes, { ordered: false });
      console.log(`Updated ${result.modifiedCount} published-deck document(s).`);
    }
  } finally {
    await mongoClient.close();
  }

  const reportPath = await writeReport(report, options.report);
  console.log(`Report: ${reportPath}`);
  if (report.unsupportedUrls.length) {
    throw new Error(`Found ${report.unsupportedUrls.length} Toolbox URL(s) that cannot be mapped to an R2 card image`);
  }
}

main().catch((error) => {
  console.error("Published-deck image sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
