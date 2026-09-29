import { games } from "../../game/game";
import { addGameLog } from "../../utils/generateGameLog";
import { GamePhase, NextPhaseP1Wins, NextPhaseP2Wins, PreGamePhase } from "@/shared/enums/Phases";
import { MatchResult, MatchStatus, PlayerSide } from "@/shared/enums/Match";

const opposite = (side: PlayerSide): PlayerSide => side === "p1" ? "p2" : "p1";
const ownerOf = (phase: PreGamePhase | GamePhase): PlayerSide => phase.includes("P2") || phase.includes("Player 2") ? "p2" : "p1";

export class RegularMatchService {
  private game(roomId: string) {
    const game = games[roomId];
    if (!game || game.sandboxMode) throw new Error("Regular match not found");
    if (game.matchStatus === MatchStatus.Completed) throw new Error("Match is complete");
    return game;
  }

  ready(roomId: string, side: PlayerSide, bothSeated: boolean) {
    const game = this.game(roomId);
    if (game.matchStatus !== MatchStatus.ReadyCheck) throw new Error("Ready check has finished");
    game.readyPlayers[side] = true;
    if (bothSeated && game.readyPlayers.p1 && game.readyPlayers.p2) {
      game.matchStatus = MatchStatus.Rps;
      game.currentPhase = PreGamePhase.RPS;
      game.activePlayer = null;
      game.gameLog = addGameLog(game.gameLog, "Both players are ready. Rock Paper Scissors begins.");
    }
  }

  rpsResolved(roomId: string) {
    const game = this.game(roomId);
    if (game.matchStatus !== MatchStatus.Rps || !game.rpsWinner) return;
    game.matchStatus = MatchStatus.Mulligans;
    game.activePlayer = ownerOf(game.currentPhase);
  }

  chooseRps(roomId: string, side: PlayerSide, choice: "Rock" | "Paper" | "Scissors") {
    const game = this.game(roomId);
    if (game.matchStatus !== MatchStatus.Rps) throw new Error("Rock Paper Scissors is not active");
    const key = side === "p1" ? "p1RPSChoice" : "p2RPSChoice";
    if (game[key]) throw new Error("Rock Paper Scissors choice already submitted");
    game[key] = choice;
    if (!game.p1RPSChoice || !game.p2RPSChoice) return;
    if (game.p1RPSChoice === game.p2RPSChoice) {
      game.gameLog = addGameLog(game.gameLog, `RPS tie: both chose ${choice}`);
      game.rpsTieCount += 1;
      game.p1RPSChoice = null;
      game.p2RPSChoice = null;
      return;
    }
    const beats: Record<"Rock" | "Paper" | "Scissors", "Rock" | "Paper" | "Scissors"> = { Rock: "Scissors", Paper: "Rock", Scissors: "Paper" };
    game.rpsWinner = beats[game.p1RPSChoice as keyof typeof beats] === game.p2RPSChoice ? "p1" : "p2";
    game.currentPhase = game.rpsWinner === "p1" ? PreGamePhase.P1Mulligan : PreGamePhase.P2Mulligan;
    game.matchStatus = MatchStatus.Mulligans;
    game.activePlayer = game.rpsWinner;
    game.gameLog = addGameLog(game.gameLog, `${game.rpsWinner.toUpperCase()} wins Rock Paper Scissors`);
  }

  completeMulligan(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (game.matchStatus !== MatchStatus.Mulligans || game.activePlayer !== side) throw new Error("It is not this player's mulligan");
    const next = (game.rpsWinner === "p1" ? NextPhaseP1Wins : NextPhaseP2Wins)[game.currentPhase];
    game.currentPhase = next;
    if (next === PreGamePhase.PostMulliganDraw) {
      game.matchStatus = MatchStatus.PreGame;
      game.activePlayer = game.rpsWinner;
    } else {
      game.activePlayer = ownerOf(next);
    }
  }

  advancePhase(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (![MatchStatus.PreGame, MatchStatus.InProgress].includes(game.matchStatus)) throw new Error("The match is not ready for phase advancement");
    if (game.activePlayer !== side) throw new Error("Only the active player may advance the phase");
    const next = (game.rpsWinner === "p1" ? NextPhaseP1Wins : NextPhaseP2Wins)[game.currentPhase];
    if (!next) throw new Error("No next phase");
    game.currentPhase = next;
    game.activePlayer = ownerOf(next);
    if (next === GamePhase.P1Countdown || next === GamePhase.P2Countdown) {
      game.matchStatus = MatchStatus.InProgress;
      game.turnNumber += 1;
    }
    game.gameLog = addGameLog(game.gameLog, `${side} advanced to ${next}`);
  }

  concede(roomId: string, side: PlayerSide) {
    this.complete(roomId, { kind: "concession", concededBy: side, winner: opposite(side) });
  }

  offerDraw(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (game.drawOffer) throw new Error("A draw offer is already pending");
    game.drawOffer = { offeredBy: side };
    game.gameLog = addGameLog(game.gameLog, `${side} offered a draw`);
  }

  rescindDrawOffer(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (game.drawOffer?.offeredBy !== side) throw new Error("Only the offering player may rescind the draw");
    game.drawOffer = null;
    game.gameLog = addGameLog(game.gameLog, `${side} rescinded the draw offer`);
  }

  acceptDrawOffer(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (!game.drawOffer || game.drawOffer.offeredBy === side) throw new Error("Only the opponent may accept the draw");
    this.complete(roomId, { kind: "draw", offeredBy: game.drawOffer.offeredBy, acceptedBy: side });
  }

  declineDrawOffer(roomId: string, side: PlayerSide) {
    const game = this.game(roomId);
    if (!game.drawOffer || game.drawOffer.offeredBy === side) throw new Error("Only the opponent may decline the draw");
    game.drawOffer = null;
    game.gameLog = addGameLog(game.gameLog, `${side} declined the draw offer`);
  }

  private complete(roomId: string, result: MatchResult) {
    const game = this.game(roomId);
    game.matchStatus = MatchStatus.Completed;
    game.result = result;
    game.drawOffer = null;
    game.activePlayer = null;
    game.gameLog = addGameLog(game.gameLog, result.kind === "draw" ? "Match ended in a draw" : `${result.winner} wins by concession`);
  }
}
