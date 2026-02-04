import axios from'axios';
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
  // const url = "https://legionstoolbox.com/index.php/wp-json/lraw/v1/cards/main";
  const url = "https://legionstoolbox.com/index.php/wp-json/lraw/v1/cards/get-cards";
  axios.get(url)
    .then(async response => {
      const cards = response.data;
      // console.log("Cards fetched successfully:", cards[0].data["COD-SD32"]);
      // console.log("Cards fetched successfully:", cards);
      // if (!cards || !cards[0] || !cards[0].data) {
      //   console.error("No cards data found in the response.");
      //   return;
      // }
      let skipped = 0;
      let inserted = 0;
      for (let i = 0 ; i < cards.length ; i++) {
        // const existingCard = await dbClient.db("legions_battleground_db").collection("cards").findOne({ id: cards[i].id });
        const existingCard = await dbClient.db("test").collection("cards").findOne({ id: cards[i].id });
        if (existingCard) {
          skipped++;
          continue;
        }
        const mappedCardToInsert = {
          id: cards[i].id,
          title: cards[i].title,
          featured_image: cards[i].featured_image,
          text: cards[i].content.text,
          content: {
            paragraphs: cards[i].content.paragraphs,
            lines: cards[i].content.lines,
            html: cards[i].content.html
          },
          card_code: cards[i].meta.card_code,
          card_release: cards[i].meta.card_release,
          legion: {
            names: cards[i].taxonomies.legion.names,
            slugs: cards[i].taxonomies.legion.slugs
          },
          set: {
            names: cards[i].taxonomies.set.names,
            slugs: cards[i].taxonomies.set.slugs
          },
          variant: {
            names: cards[i].taxonomies.variant.names,
            slugs: cards[i].taxonomies.variant.slugs
          },
          rarity: {
            names: cards[i].taxonomies.rarity.names,
            slugs: cards[i].taxonomies.rarity.slugs
          },
          card_type: {
            names: cards[i].taxonomies.card_type.names,
            slugs: cards[i].taxonomies.card_type.slugs
          },
          card_subtype: {
            names: cards[i].taxonomies.card_subtype.names,
            slugs: cards[i].taxonomies.card_subtype.slugs
          },
          card_srl: {
            names: cards[i].taxonomies.card_srl.names,
            slugs: cards[i].taxonomies.card_srl.slugs
          },
          keywords: {
            names: cards[i].taxonomies.keywords.names,
            slugs: cards[i].taxonomies.keywords.slugs
          },
          permalink: cards[i].permalink,
          attack: cards[i].attack
        }
        // dbClient.db("legions_battleground_db").collection("cards").insertOne(mappedCardToInsert)
        dbClient.db("test").collection("cards").insertOne(mappedCardToInsert)
        inserted++;
      }
      console.log(`Finished processing cards. Skipped: ${skipped}, Inserted: ${inserted}`);
    })
    .catch(error => {
      console.error("Error fetching cards:", error);
    });

}
main();