import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "@/shared/constants/initialGameState";
import { MatchStatus } from "@/shared/enums/Match";
import { GamePhase, PreGamePhase } from "@/shared/enums/Phases";
import { games } from "@/server/game/game";
import { RegularMatchService } from "@/server/services/game/RegularMatchService";
import { GameService } from "@/server/services/game/GameService";

const roomId = "regular-match-service";

describe("RegularMatchService", () => {
  let service: RegularMatchService;

  beforeEach(() => {
    service = new RegularMatchService();
    games[roomId] = { ...createInitialGameState(), sandboxMode: false };
  });

  it("allows early readiness but starts RPS only after both seats are ready", () => {
    service.ready(roomId, "p1", false);
    expect(games[roomId].matchStatus).toBe(MatchStatus.ReadyCheck);
    service.ready(roomId, "p2", true);
    expect(games[roomId].matchStatus).toBe(MatchStatus.Rps);
  });

  it("starts each regular room with independent ready state", () => {
    const gameService = new GameService();
    const firstRoom = "regular-state-isolation-first";
    const secondRoom = "regular-state-isolation-second";
    delete games[firstRoom];
    delete games[secondRoom];

    gameService.createRegularLobbyGame(firstRoom).readyPlayers.p1 = true;
    const secondGame = gameService.createRegularLobbyGame(secondRoom);

    expect(secondGame.readyPlayers).toEqual({ p1: false, p2: false });
    delete games[firstRoom];
    delete games[secondRoom];
  });

  it("keeps the regular board empty through RPS, including a tie", () => {
    service.ready(roomId, "p1", true);
    service.ready(roomId, "p2", true);
    service.chooseRps(roomId, "p1", "Rock");
    service.chooseRps(roomId, "p2", "Rock");
    expect(games[roomId].matchStatus).toBe(MatchStatus.Rps);
    expect(games[roomId].rpsWinner).toBeNull();
    expect(games[roomId].rpsTieCount).toBe(1);
    expect(games[roomId].started).toBe(false);
    expect(games[roomId].p1PlayerHand).toHaveLength(0);
    expect(games[roomId].p2PlayerHand).toHaveLength(0);
  });

  it("waits for the RPS winner to choose turn order before opening hands are dealt", () => {
    service.ready(roomId, "p1", true);
    service.ready(roomId, "p2", true);
    service.chooseRps(roomId, "p1", "Rock");
    service.chooseRps(roomId, "p2", "Scissors");

    expect(games[roomId]).toMatchObject({
      rpsWinner: "p1",
      firstPlayer: null,
      matchStatus: MatchStatus.FirstPlayerChoice,
      activePlayer: null,
      started: false,
    });
    expect(() => service.chooseFirstPlayer(roomId, "p2", "first")).toThrow("Only the Rock Paper Scissors winner");

    service.chooseFirstPlayer(roomId, "p1", "second");
    expect(games[roomId]).toMatchObject({
      firstPlayer: "p2",
      matchStatus: MatchStatus.Mulligans,
      currentPhase: PreGamePhase.P2Mulligan,
      activePlayer: "p2",
    });
    expect(() => service.chooseFirstPlayer(roomId, "p1", "first")).toThrow("Turn order choice is not active");
  });

  it("uses the selected first player for the opening sequence", () => {
    Object.assign(games[roomId], {
      rpsWinner: "p1",
      firstPlayer: "p2",
      matchStatus: MatchStatus.Mulligans,
      currentPhase: PreGamePhase.P2Mulligan,
      activePlayer: "p2",
    });

    service.completeMulligan(roomId, "p2");
    expect(games[roomId]).toMatchObject({ currentPhase: PreGamePhase.P1Mulligan, activePlayer: "p1" });
  });

  it("allows only the active player to advance to the immediate next phase", () => {
    Object.assign(games[roomId], { matchStatus: MatchStatus.InProgress, activePlayer: "p1", rpsWinner: "p1", firstPlayer: "p1", currentPhase: GamePhase.P1War });
    expect(() => service.advancePhase(roomId, "p2")).toThrow("Only the active player");
    service.advancePhase(roomId, "p1");
    expect(games[roomId].currentPhase).toBe(GamePhase.P1EndOfWar);
  });

  it("concedes immediately and rejects later events", () => {
    service.concede(roomId, "p1");
    expect(games[roomId].result).toEqual({ kind: "concession", concededBy: "p1", winner: "p2" });
    expect(() => service.offerDraw(roomId, "p2")).toThrow("Match is complete");
  });

  it("keeps draw offers pending until their owner or opponent resolves them", () => {
    service.offerDraw(roomId, "p1");
    expect(games[roomId].drawOffer).toEqual({ offeredBy: "p1" });
    service.rescindDrawOffer(roomId, "p1");
    service.offerDraw(roomId, "p1");
    service.declineDrawOffer(roomId, "p2");
    service.offerDraw(roomId, "p2");
    service.acceptDrawOffer(roomId, "p1");
    expect(games[roomId].result).toEqual({ kind: "draw", offeredBy: "p2", acceptedBy: "p1" });
  });
});
