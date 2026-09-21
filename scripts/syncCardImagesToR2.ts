import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { S3Client } from "@aws-sdk/client-s3";
import { MongoClient, ServerApiVersion } from "mongodb";
import {
  collectToolboxImageUrls,
  findObjectKeyCollisions,
  mapWithConcurrency,
  mergeToolboxImageUrls,
  syncImage,
  toPublicR2Url,
  type ImageSyncResult,
} from "../src/server/utils/r2CardImageSync";
import { getStoredToolboxImageUrls, updateCardImageReferences } from "../src/server/utils/mongoCardImageReferences";

const TOOLBOX_CARDS_URL = "https://api.legionstoolbox.com/index.php/wp-json/lraw/v1/cards/get-cards";

type CliOptions = { apply: boolean; refresh: boolean; concurrency: number; report?: string };

function readOptions(args: string[]): CliOptions {
  const option = (name: string) => args.indexOf(name);
  const limitIndex = option("--concurrency");
  const reportIndex = option("--report");
  const concurrency = limitIndex === -1 ? 5 : Number(args[limitIndex + 1]);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) {
    throw new Error("--concurrency must be an integer between 1 and 20");
  }
  return {
    apply: option("--apply") !== -1,
    refresh: option("--refresh") !== -1,
    concurrency,
    report: reportIndex === -1 ? undefined : args[reportIndex + 1],
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function fetchCatalogue(): Promise<unknown> {
  const response = await fetch(TOOLBOX_CARDS_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Card catalogue returned HTTP ${response.status}`);
  return response.json();
}

async function writeReport(results: ImageSyncResult[], reportPath?: string): Promise<string> {
  const path = reportPath || join(".card-image-sync", `report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  return path;
}

async function main() {
  const options = readOptions(process.argv.slice(2));
  const catalogue = await fetchCatalogue();
  const catalogueImageUrls = [...collectToolboxImageUrls(catalogue)];

  const client = new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") },
  });
  const mongoClient = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  const publicBaseUrl = options.apply ? required("R2_PUBLIC_BASE_URL") : undefined;

  let results: ImageSyncResult[] = [];
  let storedImageUrlCount = 0;
  try {
    await mongoClient.connect();
    const database = mongoClient.db(required("MONGO_DB_NAME"));
    const storedImageUrls = await getStoredToolboxImageUrls(database);
    storedImageUrlCount = storedImageUrls.length;
    const imageUrls = mergeToolboxImageUrls(catalogueImageUrls, storedImageUrls).sort();
    if (!imageUrls.length) throw new Error("No Toolbox image URLs were found in the catalogue or MongoDB");
    const collisions = findObjectKeyCollisions(imageUrls);
    if (collisions.size) {
      const details = [...collisions].map(([key, urls]) => `${key}: ${urls.join(", ")}`).join("\n");
      throw new Error(`Refusing to overwrite colliding image filenames:\n${details}`);
    }
    console.log(`${options.apply ? "Syncing" : "Dry run for"} ${imageUrls.length} card images (${catalogueImageUrls.length} catalogue, ${storedImageUrlCount} stored Mongo URLs; ${options.concurrency} concurrent requests).`);

    results = await mapWithConcurrency(imageUrls, options.concurrency, async (sourceUrl) => {
      const result = await syncImage(sourceUrl, {
        bucket: required("R2_BUCKET"), client, dryRun: !options.apply, refresh: options.refresh,
      });
      if (!publicBaseUrl || !result.objectKey || (result.status !== "uploaded" && result.status !== "skipped")) {
        return result;
      }

      try {
        result.referenceUpdates = await updateCardImageReferences(
          database,
          sourceUrl,
          toPublicR2Url(publicBaseUrl, result.objectKey),
        );
        return result;
      } catch (error) {
        return {
          ...result,
          status: "failed",
          reason: `R2 object is present, but Mongo update failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    });
  } finally {
    await mongoClient.close();
  }
  const totals = results.reduce<Record<string, number>>((count, result) => {
    count[result.status] = (count[result.status] || 0) + 1;
    return count;
  }, {});
  const reportPath = await writeReport(results, options.report);
  console.log(`Finished: ${JSON.stringify(totals)}. Report: ${reportPath}`);
  if (options.apply) {
    const updates = results.reduce((total, result) => ({
      cards: total.cards + (result.referenceUpdates?.cards || 0),
      decks: total.decks + (result.referenceUpdates?.decks || 0),
    }), { cards: 0, decks: 0 });
    console.log(`Mongo references updated: ${updates.cards} card documents, ${updates.decks} deck documents.`);
  }
  if (totals.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Card-image sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
