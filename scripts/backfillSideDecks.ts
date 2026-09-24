import { MongoClient, ServerApiVersion } from "mongodb";

const args = process.argv.slice(2);
const apply = args.includes("--apply");

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const client = new MongoClient(required("MONGO_URL"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  try {
    await client.connect();
    const dbName = required("MONGO_DB_NAME");
    const db = client.db(dbName);
    console.log(`Database: ${dbName}`);
    for (const name of ["decks", "published_decks"]) {
      const collection = db.collection(name);
      const filter = { side_deck: { $exists: false } };
      const count = await collection.countDocuments(filter);
      console.log(`${name}: ${count} document(s) need a side_deck backfill.`);
      if (apply && count) {
        const result = await collection.updateMany(filter, { $set: { side_deck: [] } });
        console.log(`${name}: updated ${result.modifiedCount} document(s).`);
      }
    }
    if (!apply) console.log("Dry run only. Re-run with --apply to write changes.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Side-deck backfill failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
