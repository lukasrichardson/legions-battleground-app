import { DeckResponse } from '../../shared/interfaces/DeckResponse';
import { ObjectId } from 'mongodb';
import {Request, Response} from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireBanlistAdmin } from '../middleware/banlistAdmin';
import { getDatabase } from '../utils/database.util';
import { BanlistInputError, getSrlStatusOptions, getSrlTitleFilter, updateBanlistEntry } from '../services/api/BanlistService';
import { ExpressApp } from '../interfaces/ExpressTypes';
import decksController from '../controllers/decks.controller';
import publishedDecksController from '../controllers/publishedDecks.controller';
import { DeckValidationError, validateDeckCompositionByIds } from "../services/api/DeckValidationService";
import { parseCardPagination, parseCardSearch } from "../utils/queryValidation.util";
import { AliasTakenError, AliasValidationError, deleteAliasForUser, getAliasForUser, setAliasForUser } from "../services/api/AliasService";
import { specialDeckFieldForCardType } from "@/shared/deckComposition";
import { RoomService } from "../services/game/RoomService";
import { passwordOrUndefined } from "../services/game/roomPassword";
import { issueAdmissionGrant, ROOM_ADMISSION_COOKIE, ROOM_ADMISSION_TTL_MS } from "./roomAdmissionTicket";

const roomService = new RoomService();

const setAdmissionCookie = (res: Response, token: string) => {
  res.cookie(ROOM_ADMISSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ROOM_ADMISSION_TTL_MS,
    path: "/",
  });
};

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
    if (typeof req.body?.roomName !== "string" || !req.body.roomName.trim() || req.body.roomName.length > 100) {
      return res.status(400).send("roomName must be a non-empty string of at most 100 characters");
    }
    if (req.body.roomPassword !== undefined && (typeof req.body.roomPassword !== "string" || req.body.roomPassword.length > 200)) {
      return res.status(400).send("roomPassword must be a string of at most 200 characters");
    }
    const playerName = await getAliasForUser(req.user!.id) ?? req.user!.name ?? req.user!.email ?? "Player";
    if (roomService.getRoom(req.body.roomName)) {
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
    await roomService.createRoom(req.body.roomName, {
      sandboxMode: Boolean(req.body.sandboxMode),
      password: passwordOrUndefined(req.body.roomPassword),
    });
    const admissionToken = issueAdmissionGrant({
      roomId: req.body.roomName,
      userId: req.user!.id,
      playerName,
      deckId: req.body.deckId,
      p2DeckId: req.body.p2DeckId || undefined,
    });
    setAdmissionCookie(res, admissionToken);
    return res.status(201).send({ roomName: req.body.roomName, playerName, admissionToken });
  });
  
  app.post("/joinRoom", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    if (typeof req.body?.roomName !== "string" || !req.body.roomName.trim() || req.body.roomName.length > 100) {
      return res.status(400).send("roomName must be a non-empty string of at most 100 characters");
    }
    if (req.body.roomPassword !== undefined && (typeof req.body.roomPassword !== "string" || req.body.roomPassword.length > 200)) {
      return res.status(400).send("roomPassword must be a string of at most 200 characters");
    }
    const playerName = await getAliasForUser(req.user!.id) ?? req.user!.name ?? req.user!.email ?? "Player";
    if (!roomService.getRoom(req.body.roomName)) {
      return res.status(400).send("roomName " + req.body.roomName + " does not exist");
    }
  
    if (!(await roomService.mayJoin(req.body.roomName, req.body.roomPassword))) {
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
    const admissionToken = issueAdmissionGrant({
      roomId: req.body.roomName,
      userId: req.user!.id,
      playerName,
      deckId: req.body.deckId,
    });
    setAdmissionCookie(res, admissionToken);
    return res.send({ roomName: req.body.roomName, playerName, admissionToken });
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
    if (typeof req.body?.name !== "string" || !req.body.name.trim() || req.body.name.length > 120) {
      return res.status(400).send("name must be a non-empty string of at most 120 characters");
    }
    if (typeof req.body.id !== "string" || !req.body.id.trim() || req.body.id.length > 100) {
      return res.status(400).send("A valid Toolbox deck ID is required");
    }
    if (!Array.isArray(req.body.cards_in_deck) || req.body.cards_in_deck.length < 1 || req.body.cards_in_deck.length > 500) {
      return res.status(400).send("An import must contain between 1 and 500 cards");
    }
    const invalidCard = req.body.cards_in_deck.some((card: unknown) => {
      if (!card || typeof card !== "object" || Array.isArray(card)) return true;
      const { code, name } = card as Record<string, unknown>;
      return (code !== undefined && (typeof code !== "string" || code.length > 100))
        || (name !== undefined && (typeof name !== "string" || name.length > 200))
        || (!code && !name);
    });
    if (invalidCard) {
      return res.status(400).send("Each imported card must have a string code or name");
    }
    if (req.body.subtitle !== undefined && (typeof req.body.subtitle !== "string" || req.body.subtitle.length > 500)) {
      return res.status(400).send("subtitle must be a string of at most 500 characters");
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
    if (typeof req.body.legion !== 'string' || !req.body.legion.trim() || req.body.legion.length > 100) {
      return res.status(400).send("legion is required and must be a string");
    }
    if (req.body.legion.toLowerCase() === "mythical-beasts") {
      legion = "Mythical Beasts";
    } else {
      legion = req.body.legion.charAt(0).toUpperCase() + req.body.legion.slice(1).toLowerCase();
    }
    
    const newDeck = {
      id: req.body.id,
      name: req.body.name,
      cards_in_deck: [] as ObjectId[],
      side_deck: [],
      warlords: [] as ObjectId[],
      synergies: [] as ObjectId[],
      veilRealms: [] as ObjectId[],
      guardians: [] as ObjectId[],
      tokens: [] as ObjectId[],
      legion,
      subtitle: req.body.subtitle,
      userId: req.user!.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("Importing deck:", req.body.legion, newDeck.legion);

    for (let i = 0 ; i < req.body.cards_in_deck.length; i++) {
      // Toolbox card codes identify a specific variation; names do not.
      let mongoCard = await db.collection("cards").findOne({ card_code: req.body.cards_in_deck[i].code });
      if (!mongoCard) {
        // Keep title matching only for legacy Toolbox payloads missing a code.
        mongoCard = await db.collection("cards").findOne({ title: req.body.cards_in_deck[i].name });
        if (!mongoCard) {
          console.log("Card not found in database:", req.body.cards_in_deck[i] );
        return res.status(400).send("Card " + req.body.cards_in_deck[i].name + " code" + req.body.cards_in_deck[i].code + " not found in database");
        }
      }
      const specialField = specialDeckFieldForCardType(mongoCard.card_type?.names?.[0]);
      if (specialField) newDeck[specialField].push(mongoCard._id);
      else newDeck.cards_in_deck.push(mongoCard._id);
      if (i === req.body.cards_in_deck.length - 1) {
        try {
          await validateDeckCompositionByIds(newDeck as DeckResponse);
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

  app.post("/api/banlist", requireAuth, requireBanlistAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updatedBanlist = await updateBanlistEntry(getDatabase(), req.body?.name, req.body?.status);
      return res.send(updatedBanlist);
    } catch (error) {
      if (error instanceof BanlistInputError) return res.status(400).send(error.message);
      throw error;
    }
  }
  );

  decksController(app);
  publishedDecksController(app);
}
