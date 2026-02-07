import { rooms } from './socketHandler';
import { DeckResponse } from '../../shared/interfaces/DeckResponse';
import { fetchPlayerDeckById, fetchToolboxDeckById } from '../utils/game.util';
import { ObjectId } from 'mongodb';
import {Request, Response} from 'express';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database.util';
import { ExpressApp } from '../interfaces/ExpressTypes';
import axios from 'axios';

export const routes = (app: ExpressApp) => {
  app.get('/healthz', (req: Request, res: Response) => {
    console.log('Health check endpoint called');
    res.send('ok');
  });
  
  app.post("/createRoom", async (req: Request, res: Response) => {
    if (!req.body.roomName) {
      return res.status(400).send("roomName is required");
    }
    if (!req.body.playerName) {
      return res.status(400).send("playerName is required");
    }
    if (rooms[req.body.roomName]) {
      return res.status(400).send("roomName " + req.body.roomName + " already exists");
    }
    if (rooms[req.body.roomName] && rooms[req.body.roomName].players[req.body.playerName]) {
      return res.status(400).send("playerName " + req.body.playerName + " already exists in room " + req.body.roomName);
    }
  
    try {
      // const deck: DeckResponse = await fetchPlayerDeckById({deckId: req.body.deckId});
      const deck = await getDatabase().collection<DeckResponse>("decks").findOne({ _id: new ObjectId(req.body.deckId) });
      if (!deck?.legion || !deck?.cards_in_deck) {
        return res.status(400).send("deckId " + req.body.deckId + " is invalid");
      }
    } catch {
      return res.status(400).send("deckId " + req.body.deckId + " is invalid");
    }
    rooms[req.body.roomName] = {
      id: req.body.roomName,
      players: {},
      sandboxMode: req.body.sandboxMode,
      password: req.body.roomPassword,
    };
    return res.send({
      roomName: req.body.roomName,
      players: rooms[req.body.roomName].players,
      sandboxMode: req.body.sandboxMode,
      password: req.body.roomPassword,
    });
  });
  
  app.post("/joinRoom", async (req: Request, res: Response) => {
    if (!req.body.roomName) {
      return res.status(400).send("roomName is required");
    }
    if (!req.body.playerName) {
      return res.status(400).send("playerName is required");
    }
    if (!rooms[req.body.roomName]) {
      return res.status(400).send("roomName " + req.body.roomName + " does not exist");
    }
    if (rooms[req.body.roomName] && Object.values(rooms?.[req.body.roomName]?.players)?.find((item: {name: string}) => item.name === req.body.playerName)) {
      return res.status(400).send("playerName " + req.body.playerName + " already exists in room " + req.body.roomName);
    }
  
    // check if password protected
    if (rooms[req.body.roomName].password && rooms[req.body.roomName].password !== req.body.roomPassword) {
      return res.status(400).send("password is incorrect");
    }
  
    try {
      const deck: DeckResponse = await fetchPlayerDeckById({deckId: req.body.deckId});
      if (!deck?.id || !deck?.legion || !deck?.cards_in_deck) {
        return res.status(400).send("deckId " + req.body.deckId + " is invalid");
      }
    } catch {
      return res.status(400).send("deckId " + req.body.deckId + " is invalid");
    }
    return res.send({ roomName: req.body.roomName, players: rooms[req.body.roomName].players });
  })

  app.get('/api/toolboxDecks/:deckId', async (req: Request, res: Response) => {
    const deckId = req.params.deckId;
    try {
      const deck: DeckResponse = await fetchToolboxDeckById({deckId});
      if (!deck?.id || !deck?.legion || !deck?.cards_in_deck) {
        console.log("Deck not found:", deckId, deck);
        return res.status(404).send("Deck not found");
      }
      return res.send(deck);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return res.status(err.response?.status || 500).send(err.response?.data || "Error fetching deck");
      }
      return res.status(500).send("Error fetching deck");
    }
  });

  app.get("/api/cards", async (req: Request, res: Response) => {
    const {legion, pageSize, page, query: search, type, rarity, set} = req.query

    const db = getDatabase();
    let query: Record<string, unknown> = {};

    if (legion && typeof legion === 'string') {
      query = { "legion.names.0": legion };
    } else if (legion && Array.isArray(legion)) {
      query = { "legion.names.0": { $in: legion } };
    }
    if (type && typeof type === 'string') {
      query = { ...query, "card_type.names.0": type };
    } else if (type && Array.isArray(type)) {
      query = { ...query, "card_type.names.0": { $in: type } };
    }
    if (rarity && typeof rarity === 'string') {
      query = { ...query, "rarity.names.0": rarity };
    } else if (rarity && Array.isArray(rarity)) {
      query = { ...query, "rarity.names.0": { $in: rarity } };
    }
    if (set && typeof set === 'string') {
      query = { ...query, "set.names.0": set };
    } else if (set && Array.isArray(set)) {
      query = { ...query, "set.names.0": { $in: set } };
    }
    if (search && typeof search === 'string' && search.trim() !== "") {
      query["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { "text": { $regex: search, $options: "i" } },
        { "card_code": { $regex: search, $options: "i" } }
      ]
    }

    const skipAmount: number = ((Number(page) || 1) - 1) * Number(pageSize || 50);

    const cards = await db.collection("cards").find(query).sort({title: 1}).skip(skipAmount).limit(Number(pageSize) || 50).toArray();

    res.send({cards, page: Number(page) || 1, pageSize: Number(pageSize) || 50, total: await db.collection("cards").countDocuments(query)});
  })

  app.get("/api/filterOptions", async (req: Request, res: Response) => {
    const db = getDatabase();
    const legion = await db.collection("cards").distinct("legion.names.0", {});
    const type = await db.collection("cards").distinct("card_type.names.0", {});
    const rarity = await db.collection("cards").distinct("rarity.names.0", {});
    const set = await db.collection("cards").distinct("set.names.0", {});
    return res.send({legion, type, rarity, set});
  }
  );

  app.post("/api/importDecks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body.name) {
      return res.status(400).send("name is required");
    }
    if (!req.body.cards_in_deck || req.body.cards_in_deck.length < 1) {
      return res.status(400).send("At least one card is required in the deck");
    }
    
    const db = getDatabase();
    
    // Check if deck with this ID already exists for this user
    const existingDeckWithId = await db.collection("decks").findOne({ 
      id: req.body.id,
      userId: req.user!.id 
    });
    if (existingDeckWithId) {
      return res.status(400).send("You already have a deck with id " + req.body.id);
    }
    
    const newDeck = {
      id: req.body.id,
      name: req.body.name,
      cards_in_deck: req.body.cards_in_deck,
      legion: req.body.legion,
      subtitle: req.body.subtitle,
      userId: req.user!.id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    // let tracker = 0;
    for (let i = 0 ; i < newDeck.cards_in_deck.length; i++) {
      const mongoCard = await db.collection("cards").findOne({ title: newDeck.cards_in_deck[i].name });
      if (!mongoCard) {
        return res.status(400).send("Card " + newDeck.cards_in_deck[i].name + " not found in database");
      }
      newDeck.cards_in_deck[i] = mongoCard;
      if (i === newDeck.cards_in_deck.length - 1) {
        const result = await db.collection("decks").insertOne(newDeck);
        return res.status(200).send({ _id: result.insertedId, ...newDeck });
      }
    } 
  }
  );

  app.get("/api/decks", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    
    // Filter decks by userId if user is authenticated
    const query = req.user?.id ? { userId: req.user.id } : {};
    const decks = await db.collection("decks").find(query).toArray();
    
    return res.send(decks);
  }
  );
  
  app.get("/api/decks/:deckId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") return res.status(400).send("Deck ID is required");
    
    let deck;
    if (deckId.length > 6) {
      const query = req.user?.id 
        ? { _id: new ObjectId(deckId), userId: req.user.id }
        : { _id: new ObjectId(deckId) };
      deck = await db.collection("decks").findOne(query);
    } else {
      const query = req.user?.id 
        ? { id: deckId, userId: req.user.id }
        : { id: deckId };
      deck = await db.collection("decks").findOne(query);
    }
    
    if (!deck) {
      return res.status(404).send("Deck not found");
    }
    return res.send(deck);
  }
  );

  app.patch("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId;
    if (!deckId) return res.status(400).send("Deck ID is required");
    
    // Check if deck exists and belongs to user
    const existingDeck = await db.collection("decks").findOne({ 
      _id: new ObjectId(deckId),
      userId: req.user!.id 
    });
    
    if (!existingDeck) {
      return res.status(404).send("Deck not found or you don't have permission to edit this deck");
    }
    
    const updatedDeck = {
      ...req.body,
      updated_at: new Date(),
    };
    delete updatedDeck._id;
    
    const result = await db.collection("decks").updateOne({ 
      _id: new ObjectId(deckId),
      userId: req.user!.id 
    }, {
      $set: {...updatedDeck}
    });
    
    if (result.modifiedCount === 0) {
      return res.status(404).send("Deck not found or no changes made");
    }
    return res.send({...updatedDeck, _id: deckId});
  }
  );

  app.post("/api/decks/:deckId/duplicate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const db = getDatabase();
      
      // Check if deck with same deckId
      const existingDeck: DeckResponse = await db.collection<DeckResponse>("decks").findOne({ 
        _id: new ObjectId(req.params.deckId),
      });
      if (!existingDeck) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: `cant find deck with deck with id "${req.params.deckId}"` 
        });
      }

      // Create the new deck object with userId
      const newDeck: DeckResponse = {
        ...existingDeck,
        name: existingDeck.name + " Copy",
        created_at: new Date(),
        updated_at: new Date(),
      };
      delete newDeck._id;

      // Insert the deck into MongoDB
      const result = await db.collection("decks").insertOne(newDeck);
      
      if (!result.insertedId) {
        return res.status(500).json({ 
          error: "Internal server error", 
          message: "Failed to create deck in database" 
        });
      }

      // Return success response with deck ID
      return res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck: {
          _id: result.insertedId,
          name: newDeck.name,
          subtitle: newDeck.subtitle,
          legion: newDeck.legion,
          userId: newDeck.userId,
          created_at: newDeck.created_at
        }
      });

    } catch (error: unknown) {
      console.error("Error creating deck:", error);
      
      // Handle specific MongoDB errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: "A deck with this ID or name already exists" 
        });
      }
      
      // Handle connection errors
      if (error && typeof error === 'object' && 'name' in error && 
          (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError')) {
        return res.status(503).json({ 
          error: "Service unavailable", 
          message: "Database connection failed. Please try again later." 
        });
      }

      // Generic server error
      return res.status(500).json({ 
        error: "Internal server error", 
        message: "An unexpected error occurred while creating the deck" 
      });
    }
  });

  app.post("/api/decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Input validation
      if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        return res.status(400).json({ 
          error: "Validation failed", 
          message: "Deck name is required and must be a non-empty string" 
        });
      }

      if (!req.body.legion || typeof req.body.legion !== 'string' || req.body.legion.trim() === '') {
        return res.status(400).json({ 
          error: "Validation failed", 
          message: "Legion is required and must be a non-empty string" 
        });
      }

      const db = getDatabase();
      
      // Check if deck with same name already exists for this user
      const existingDeck = await db.collection("decks").findOne({ 
        name: req.body.name.trim(),
        userId: req.user!.id 
      });
      if (existingDeck) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: `You already have a deck with name "${req.body.name}"` 
        });
      }

      // Create the new deck object with userId
      const newDeck = {
        name: req.body.name.trim(),
        subtitle: "",
        legion: req.body.legion.trim(),
        userId: req.user!.id,
        cards_in_deck: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Insert the deck into MongoDB
      const result = await db.collection("decks").insertOne(newDeck);
      
      if (!result.insertedId) {
        return res.status(500).json({ 
          error: "Internal server error", 
          message: "Failed to create deck in database" 
        });
      }

      // Return success response with deck ID
      return res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck: {
          _id: result.insertedId,
          name: newDeck.name,
          subtitle: newDeck.subtitle,
          legion: newDeck.legion,
          userId: newDeck.userId,
          created_at: newDeck.created_at
        }
      });

    } catch (error: unknown) {
      console.error("Error creating deck:", error);
      
      // Handle specific MongoDB errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: "A deck with this ID or name already exists" 
        });
      }
      
      // Handle connection errors
      if (error && typeof error === 'object' && 'name' in error && 
          (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError')) {
        return res.status(503).json({ 
          error: "Service unavailable", 
          message: "Database connection failed. Please try again later." 
        });
      }

      // Generic server error
      return res.status(500).json({ 
        error: "Internal server error", 
        message: "An unexpected error occurred while creating the deck" 
      });
    }
  });

  app.delete("/api/decks/:deckId", requireAuth,  async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId;
    if (!deckId) return res.status(400).send("Deck ID is required");
    const result = await db.collection("decks").deleteOne({ 
      _id: new ObjectId(deckId),
      userId: req.user.id
    });
    if (result.deletedCount === 0) {
      return res.status(404).send("Deck not found or you don't have permission to delete this deck");
    }
    return res.send({ success: true });
  });
}