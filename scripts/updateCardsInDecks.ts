import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = process.env.MONGO_URL || "your-mongodb-connection-string-here";
console.log("url:", uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const connect = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    // Ensures that the client will close when you finish/error
    console.log("closing client, ", err);
    await client.close();
  }
}

const main = async () => {
  const dbClient = await connect();
  const decksInMongo = await dbClient.db("legions_battleground_db").collection("decks").find({}).toArray();
  decksInMongo.forEach(async (deck) => {
    let updated = false;
    const updatedCards = await Promise.all(deck.cards_in_deck.map(async (card: any) => {
      const cardInDb = await dbClient.db("legions_battleground_db").collection("cards").findOne({ id: card.id });
      if (cardInDb && cardInDb.featured_image && card.featured_image !== cardInDb.featured_image) {
        updated = true;
        return {
          ...card,
          featured_image: cardInDb.featured_image
        };
      } else {
        return card;
      }
    }));
    if (updated) {
      await dbClient.db("legions_battleground_db").collection("decks").updateOne(
        { _id: deck._id },
        { $set: { cards_in_deck: updatedCards }, $unset: { image: "" } },
      );
      console.log(`Updated deck ${deck.name} (${deck._id}) with new card images.`);
    }
  });
}
main();