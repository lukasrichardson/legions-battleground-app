import { rooms } from './socketHandler';
import { DeckResponse } from '../../shared/interfaces/DeckResponse';
import { ObjectId } from 'mongodb';
import {Request, Response} from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database.util';
import { getSrlStatusOptions, getSrlTitleFilter, updateBanlistEntry } from '../services/api/BanlistService';
import { BanlistStatus } from '../../shared/interfaces/BanlistItem.mongo';
import { ExpressApp } from '../interfaces/ExpressTypes';
import decksController from '../controllers/decks.controller';
import publishedDecksController from '../controllers/publishedDecks.controller';
import { DeckValidationError, validateDeckComposition } from "../services/api/DeckValidationService";
import { parseCardPagination, parseCardSearch } from "../utils/queryValidation.util";
import { AliasTakenError, AliasValidationError, deleteAliasForUser, getAliasForUser, setAliasForUser } from "../services/api/AliasService";

export const routes = (app: ExpressApp) => {
  app.get('/healthz', (req: Request, res: Response) => {
    console.log('Health check endpoint called');
    res.send('ok');
  });
  
  app.get("/api/me/alias", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.send({ alias: await getAliasForUser(req.user!.id) });
  });

  app.put("/api/me/alias", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      return res.send({ alias: await setAliasForUser(req.user!.id, req.body?.alias) });
    } catch (error) {
      if (error instanceof AliasValidationError) return res.status(400).send({ error: error.message });
      if (error instanceof AliasTakenError) return res.status(409).send({ error: error.message });
      throw error;
    }
  });

  app.delete("/api/me/alias", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const fallbackPublicName = req.user!.name ?? req.user!.email ?? "Unknown Author";
    await deleteAliasForUser(req.user!.id, fallbackPublicName);
    return res.status(204).end();
  });

  app.post("/createRoom", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body.roomName) {
      return res.status(400).send("roomName is required");
    }
    const playerName = await getAliasForUser(req.user!.id) ?? req.user!.name ?? req.user!.email ?? "Player";
    if (rooms[req.body.roomName]) {
      return res.status(400).send("roomName " + req.body.roomName + " already exists");
    }
  
    try {
      const deck = await getDatabase().collection<DeckResponse>("decks").findOne({ _id: new ObjectId(req.body.deckId), userId: req.user!.id });
      if (!deck?.legion || !deck?.cards_in_deck) {
        return res.status(400).send("deckId " + req.body.deckId + " is invalid");
      }
      if (req.body.p2DeckId) {
        const p2Deck = await getDatabase().collection<DeckResponse>("decks").findOne({ _id: new ObjectId(req.body.p2DeckId), userId: req.user!.id });
        if (!p2Deck?.legion || !p2Deck?.cards_in_deck) {
          return res.status(400).send("p2DeckId " + req.body.p2DeckId + " is invalid");
        }
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
      playerName,
      players: rooms[req.body.roomName].players,
      sandboxMode: req.body.sandboxMode,
      password: req.body.roomPassword,
    });
  });
  
  app.post("/joinRoom", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body.roomName) {
      return res.status(400).send("roomName is required");
    }
    const playerName = await getAliasForUser(req.user!.id) ?? req.user!.name ?? req.user!.email ?? "Player";
    if (!rooms[req.body.roomName]) {
      return res.status(400).send("roomName " + req.body.roomName + " does not exist");
    }
  
    // check if password protected
    if (rooms[req.body.roomName].password && rooms[req.body.roomName].password !== req.body.roomPassword) {
      return res.status(400).send("password is incorrect");
    }
  
    try {
      const deck: DeckResponse = await getDatabase().collection<DeckResponse>("decks").findOne({ _id: new ObjectId(req.body.deckId), userId: req.user!.id });
      if (!deck?._id || !deck?.legion || !deck?.cards_in_deck) {
        return res.status(400).send("deckId " + req.body.deckId + " is invalid");
      }
    } catch {
      return res.status(400).send("deckId " + req.body.deckId + " is invalid");
    }
    return res.send({ roomName: req.body.roomName, playerName, players: rooms[req.body.roomName].players });
  })

  app.get("/api/cards", async (req: Request, res: Response) => {
    const {legion, pageSize, page, query: search, type, rarity, set, srlStatus} = req.query

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
    const requestedSrlStatuses = typeof srlStatus === 'string'
      ? [srlStatus]
      : Array.isArray(srlStatus)
        ? srlStatus.filter((status): status is string => typeof status === 'string')
        : [];
    if (requestedSrlStatuses.length) {
      query = { ...query, $and: [await getSrlTitleFilter(db, requestedSrlStatuses)] };
    }
    const literalSearch = parseCardSearch(search);
    if (literalSearch) {
      query["$or"] = [
        { title: { $regex: literalSearch, $options: "i" } },
        { "text": { $regex: literalSearch, $options: "i" } },
        { "card_code": { $regex: literalSearch, $options: "i" } }
      ]
    }

    const pagination = parseCardPagination(page, pageSize);
    const skipAmount = (pagination.page - 1) * pagination.pageSize;

    const cards = await db.collection("cards").find(query).sort({title: 1}).skip(skipAmount).limit(pagination.pageSize).toArray();

    res.send({cards, page: pagination.page, pageSize: pagination.pageSize, total: await db.collection("cards").countDocuments(query)});
  })

  app.get("/api/cards/filterOptions", async (req: Request, res: Response) => {
    const db = getDatabase();
    const legion = await db.collection("cards").distinct("legion.names.0", {});
    const type = await db.collection("cards").distinct("card_type.names.0", {});
    const rarity = await db.collection("cards").distinct("rarity.names.0", {});
    const set = await db.collection("cards").distinct("set.names.0", {});
    const srlStatus = await db.collection("banlist").distinct("status", { status: { $type: "string" } });
    return res.send({legion, type, rarity, set, srlStatus: getSrlStatusOptions(srlStatus)});
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
    // if legion is "mythical-beasts" change it to "Mythical Beasts"  otherwise capitalize first letter and lowercase the rest
    let legion = null;
    if (!req.body.legion || typeof req.body.legion !== 'string') {
      return res.status(400).send("legion is required and must be a string");
    }
    if (req.body.legion[0] === "mythical-beasts") {
      legion = "Mythical Beasts";
    } else {
      legion = req.body.legion.charAt(0).toUpperCase() + req.body.legion.slice(1).toLowerCase();
    }
    
    const newDeck = {
      id: req.body.id,
      name: req.body.name,
      cards_in_deck: req.body.cards_in_deck,
      side_deck: [],
      legion,
      subtitle: req.body.subtitle,
      userId: req.user!.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("Importing deck:", req.body.legion, newDeck.legion);

    for (let i = 0 ; i < newDeck.cards_in_deck.length; i++) {
      // Toolbox card codes identify a specific variation; names do not.
      let mongoCard = await db.collection("cards").findOne({ card_code: newDeck.cards_in_deck[i].code });
      if (!mongoCard) {
        // Keep title matching only for legacy Toolbox payloads missing a code.
        mongoCard = await db.collection("cards").findOne({ title: newDeck.cards_in_deck[i].name });
        if (!mongoCard) {
          console.log("Card not found in database:", newDeck.cards_in_deck[i] );
        return res.status(400).send("Card " + newDeck.cards_in_deck[i].name + " code" + newDeck.cards_in_deck[i].code + " not found in database");
        }
      }
      newDeck.cards_in_deck[i] = mongoCard;
      if (i === newDeck.cards_in_deck.length - 1) {
        try {
          await validateDeckComposition(newDeck as DeckResponse);
        } catch (error) {
          if (error instanceof DeckValidationError) return res.status(400).send(error.message);
          throw error;
        }
        const result = await db.collection("decks").insertOne(newDeck);
        return res.status(200).send({ _id: result.insertedId, ...newDeck });
      }
    } 
  }
  );

  app.get("/api/banlist", async (req: Request, res: Response) => {
    const db = getDatabase();
    const banlist = await db.collection("banlist").find({}).toArray();
    return res.send(banlist);
  }
  );

  app.post("/api/banlist", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body.name) {
      return res.status(400).send("name is required");
    }
    if (!req.body.status) {
      return res.status(400).send("status is required");
    }
    if (!Object.values(BanlistStatus).includes(req.body.status)) {
      return res.status(400).send("status is invalid");
    }
    const updatedBanlist = await updateBanlistEntry(getDatabase(), req.body.name, req.body.status);
    return res.send(updatedBanlist);
  }
  );

  decksController(app);
  publishedDecksController(app);
}
