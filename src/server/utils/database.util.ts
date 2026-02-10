import { MongoClient, ServerApiVersion } from 'mongodb';

let client: MongoClient | null = null;

export const getMongoClient = (): MongoClient => {
  if (!client) {
    const uri = process.env.MONGO_URL;
    if (!uri) {
      throw new Error("MONGO_URL environment variable is required");
    }
    
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        deprecationErrors: true,
      }
    });
  }
  return client;
};

export const connectToDatabase = async (): Promise<MongoClient> => {
  const client = getMongoClient();
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB for game utilities");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export const getDatabase = () => {
  return getMongoClient().db("legions_battleground_db");
  // return getMongoClient().db("test");
};

// Graceful shutdown function
export const closeDatabaseConnection = async (): Promise<void> => {
  if (client) {
    try {
      await client.close();
      client = null;
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
};

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });
}