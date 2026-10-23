import { copyPublishedDeck } from "../services/api/DeckPublicationService";
import { ExpressApp } from "../interfaces/ExpressTypes";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { normalizeDeck, SPECIAL_DECK_FIELDS } from "@/shared/deckComposition";
import { parseDeckUpdateInput, validateDeckCompositionByIds } from "../services/api/DeckValidationService";
import { applyDeckJsonPatch, EditableDeckSnapshot } from "../services/api/DeckPatchService";
import {
  createNewDeck,
  duplicateDeckById,
  getDeckById,
  getDecksForPlayer,
  getDeckListSummariesForPlayer,
  getRecentDeckListSummariesForPlayer,
  getFilterOptionsForPlayerDecks,
  updateDeckById,
  deleteDeckById
} from "../services/api/DecksService";

import { deckErrorHandler, sendCreatedDeck } from "./deckResponses";
import { DeckServiceError } from "../services/api/DeckServiceError";

export default function decksController(app: ExpressApp) {
  app.get("/api/decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { legion } = req.query;
    const decks = req.query.view === "recent"
      ? await getRecentDeckListSummariesForPlayer(req.user!)
      : req.query.view === "summary"
        ? await getDeckListSummariesForPlayer(req.user!, legion as string | string[] | undefined)
        : await getDecksForPlayer(req.user!, legion as string | string[] | undefined);

    return res.send(decks);
  });

  app.get("/api/decks/filterOptions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const legion = await getFilterOptionsForPlayerDecks(req.user!);
    return res.send({ legion });
  });

  app.get("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") throw new DeckServiceError("invalid_input", "Deck ID is required");

    const deck = await getDeckById(req.user!, deckId);

    if (!deck) {
      throw new DeckServiceError("not_found", "Deck not found");
    }
    return res.send(deck);
  });

  app.patch("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId;
    if (!deckId) throw new DeckServiceError("invalid_input", "Deck ID is required");

    const existingDeck = await getDeckById(req.user!, deckId);
    if (!existingDeck) {
      throw new DeckServiceError("not_found", "Deck not found or you don't have permission to edit this deck");
    }

    const patchSnapshot: EditableDeckSnapshot = {
      name: existingDeck.name,
      subtitle: existingDeck.subtitle,
      legion: existingDeck.legion,
      cards_in_deck: existingDeck.cards_in_deck.map((id) => id.toString()),
      side_deck: (existingDeck.side_deck ?? []).map((id) => id.toString()),
      warlords: existingDeck.warlords.map((id) => id.toString()),
      synergies: existingDeck.synergies.map((id) => id.toString()),
      veilRealms: existingDeck.veilRealms.map((id) => id.toString()),
      guardians: existingDeck.guardians.map((id) => id.toString()),
      tokens: existingDeck.tokens.map((id) => id.toString()),
    };
    const updateInput = req.is("application/json-patch+json")
      ? parseDeckUpdateInput(applyDeckJsonPatch(patchSnapshot, req.body))
      : parseDeckUpdateInput(req.body);
    const candidateDeck = normalizeDeck({ ...existingDeck, ...updateInput });
    const updatesComposition = "cards_in_deck" in updateInput || "side_deck" in updateInput || "legion" in updateInput
      || SPECIAL_DECK_FIELDS.some((field) => field in updateInput);
    if (updatesComposition) await validateDeckCompositionByIds(candidateDeck);
    const updatedDeck = await updateDeckById(req.user!, deckId, updateInput);
    if (!updatedDeck) {
      throw new DeckServiceError("not_found", "Deck not found or you don't have permission to edit this deck");
    }

    return res.send(updatedDeck);
  });

  app.post("/api/decks/:deckId/duplicate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return sendCreatedDeck(res, await duplicateDeckById(req.user!, req.params.deckId));
  });

  app.post("/api/decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return sendCreatedDeck(res, await createNewDeck(req.user!, req.body));
  });

  app.post("/api/decks/:publishedDeckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return sendCreatedDeck(res, await copyPublishedDeck(req.user!, req.params.publishedDeckId));
  });

  app.delete("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId;
    await deleteDeckById(req.user!, deckId);
    return res.send({ success: true });
  });
  app.use("/api/decks", deckErrorHandler);
}
