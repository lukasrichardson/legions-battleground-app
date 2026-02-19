import {
  // useAppDispatch, 
  useAppSelector } from "@/client/redux/hooks";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
// import { GAME_EVENT } from '@/shared/enums/GameEvent';
import {
  // renderAP,
  renderCardRow,
  renderCardRowUpsideDown,
  renderCardZone,
  // renderDeckNameZone,
  renderDeckZone,
  renderHand,
  // renderHealth
} from "./Components";
// import { NextPhaseP1Wins, NextPhaseP2Wins } from "@/client/redux/phaseSlice";
// import { emitGameEvent } from "@/client/utils/emitEvent";

export default function PlayArea({ }) {
  // const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  // const phaseState = useAppSelector((state) => state.phaseState);
  // const sequenceState = useAppSelector((state) => state.sequenceState);
  // const { sequences, resolving } = sequenceState;
  // const { currentPhase, turnNumber, rpsWinner } = phaseState;
  const {
    p2PlayerHand,
    p2PlayerDeck,
    p2PlayerDiscard,
    p2PlayerEradication,
    p2PlayerFortifieds,
    p2PlayerUnifieds,
    p2PlayerWarriors,
    p2PlayerVeilRealm,
    p2PlayerWarlord,
    p2PlayerSynergy,
    p2PlayerGuardian,
    p2PlayerTokens,
    p2PlayerRevealed,

    p1PlayerHand,
    p1PlayerDeck,
    p1PlayerDiscard,
    p1PlayerEradication,
    p1PlayerFortifieds,
    p1PlayerUnifieds,
    p1PlayerWarriors,
    p1PlayerVeilRealm,
    p1PlayerWarlord,
    p1PlayerSynergy,
    p1PlayerGuardian,
    p1PlayerTokens,
    p1PlayerRevealed,
  } = gameState;
  const { side } = clientGameState;
  const p1 = side === "p1";
  // const goToNextPhase = () => {
  //   emitGameEvent({ type: GAME_EVENT.nextPhase, data: null });
  // }
  // const nextPhaseMap = rpsWinner === "p1" ? NextPhaseP1Wins : NextPhaseP2Wins;

  return (
    <div className="relative flex flex-col w-[80%] h-full overflow-visible">
      {renderHand(p1 ? p2PlayerHand : p1PlayerHand, p1 ? CARD_TARGET.P2_PLAYER_HAND : CARD_TARGET.P1_PLAYER_HAND, p1)}
      <div className="w-full h-[40%] grid grid-rows-3 grid-cols-8">

        {renderCardZone(p1 ? p2PlayerEradication : p1PlayerEradication, p1 ? CARD_TARGET.P2_PLAYER_ERADICATION : CARD_TARGET.P1_PLAYER_ERADICATION, "Eradication")}
        {renderCardRowUpsideDown(p1 ? p2PlayerFortifieds : p1PlayerFortifieds, p1 ? CARD_TARGET.P2_PLAYER_FORTIFIED : CARD_TARGET.P1_PLAYER_FORTIFIED, "Fortified")}
        {renderCardZone(p1 ? p2PlayerGuardian : p1PlayerGuardian, p1 ? CARD_TARGET.P2_PLAYER_GUARDIAN : CARD_TARGET.P1_PLAYER_GUARDIAN, "Guardian")}
        {renderCardZone(p1 ? p2PlayerRevealed : p1PlayerRevealed, p1 ? CARD_TARGET.P2_PLAYER_REVEALED : CARD_TARGET.P1_PLAYER_REVEALED, "Revealed")}
        {renderCardZone(p1 ? p2PlayerDiscard : p1PlayerDiscard, p1 ? CARD_TARGET.P2_PLAYER_DISCARD : CARD_TARGET.P1_PLAYER_DISCARD, "Discard")}
        {renderCardRowUpsideDown(p1 ? p2PlayerUnifieds : p1PlayerUnifieds, p1 ? CARD_TARGET.P2_PLAYER_UNIFIED : CARD_TARGET.P1_PLAYER_UNIFIED, "Unified")}
        {renderCardZone(p1 ? p2PlayerSynergy : p1PlayerSynergy, p1 ? CARD_TARGET.P2_PLAYER_SYNERGY : CARD_TARGET.P1_PLAYER_SYNERGY, "Synergy")}
        {renderCardZone(p1 ? p2PlayerTokens : p1PlayerTokens, p1 ? CARD_TARGET.P2_PLAYER_TOKENS : CARD_TARGET.P1_PLAYER_TOKENS, "Tokens")}
        {renderDeckZone(p1 ? p2PlayerDeck[0] : p1PlayerDeck[0], p1 ? CARD_TARGET.P2_PLAYER_DECK : CARD_TARGET.P1_PLAYER_DECK, p1)}
        {renderCardRowUpsideDown(p1 ? p2PlayerWarriors : p1PlayerWarriors, p1 ? CARD_TARGET.P2_PLAYER_WARRIOR : CARD_TARGET.P1_PLAYER_WARRIOR, "Warrior")}
        {renderCardZone(p1 ? p2PlayerWarlord : p1PlayerWarlord, p1 ? CARD_TARGET.P2_PLAYER_WARLORD : CARD_TARGET.P1_PLAYER_WARLORD, "Warlord")}
        {renderCardZone(p1 ? p2PlayerVeilRealm : p1PlayerVeilRealm, p1 ? CARD_TARGET.P2_PLAYER_VEIL_REALM : CARD_TARGET.P1_PLAYER_VEIL_REALM, "Veil / Realm")}
      </div>
      {/* <div className="h-[0%] flex items-center justify-between px-6">
        {!sandboxMode ? <><div className="flex items-center gap-4">
          <span className="text-blue-200 font-medium">
            Turn <span className="text-white font-bold">{turnNumber}</span>
          </span>
          <div className="w-px h-6 bg-blue-400/30"></div>
          <span className="text-blue-200">
            Phase: <span className="text-cyan-300 font-semibold">{currentPhase}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={goToNextPhase}
            className="px-4 py-1.5 bg-blue-600/80 hover:bg-blue-500/90 border border-blue-400/50 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
          >
            Next: {nextPhaseMap[currentPhase]}
          </button>
        </div></> : null}
      </div> */}
      <div className="w-full h-[40%] grid grid-rows-3 grid-cols-8">
        {renderCardZone(p1 ? p1PlayerVeilRealm : p2PlayerVeilRealm, p1 ? CARD_TARGET.P1_PLAYER_VEIL_REALM : CARD_TARGET.P2_PLAYER_VEIL_REALM, "Veil / Realm")}
        {renderCardZone(p1 ? p1PlayerWarlord : p2PlayerWarlord, p1 ? CARD_TARGET.P1_PLAYER_WARLORD : CARD_TARGET.P2_PLAYER_WARLORD, "Warlord")}
        {renderCardRow(p1 ? p1PlayerWarriors : p2PlayerWarriors, p1 ? CARD_TARGET.P1_PLAYER_WARRIOR : CARD_TARGET.P2_PLAYER_WARRIOR, "Warrior")}
        {renderDeckZone(p1 ? p1PlayerDeck[0] : p2PlayerDeck[0], p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK, p1)}
        {renderCardZone(p1 ? p1PlayerTokens : p2PlayerTokens, p1 ? CARD_TARGET.P1_PLAYER_TOKENS : CARD_TARGET.P2_PLAYER_TOKENS, "Tokens")}
        {renderCardZone(p1 ? p1PlayerSynergy : p2PlayerSynergy, p1 ? CARD_TARGET.P1_PLAYER_SYNERGY : CARD_TARGET.P2_PLAYER_SYNERGY, "Synergy")}
        {renderCardRow(p1 ? p1PlayerUnifieds : p2PlayerUnifieds, p1 ? CARD_TARGET.P1_PLAYER_UNIFIED : CARD_TARGET.P2_PLAYER_UNIFIED, "Unified")}
        {renderCardZone(p1 ? p1PlayerDiscard : p2PlayerDiscard, p1 ? CARD_TARGET.P1_PLAYER_DISCARD : CARD_TARGET.P2_PLAYER_DISCARD, "Discard")}
        {renderCardZone(p1 ? p1PlayerRevealed : p2PlayerRevealed, p1 ? CARD_TARGET.P1_PLAYER_REVEALED : CARD_TARGET.P2_PLAYER_REVEALED, "Revealed")}
        {renderCardZone(p1 ? p1PlayerGuardian : p2PlayerGuardian, p1 ? CARD_TARGET.P1_PLAYER_GUARDIAN : CARD_TARGET.P2_PLAYER_GUARDIAN, "Guardian")}
        {renderCardRow(p1 ? p1PlayerFortifieds : p2PlayerFortifieds, p1 ? CARD_TARGET.P1_PLAYER_FORTIFIED : CARD_TARGET.P2_PLAYER_FORTIFIED, "Fortified")}
        {renderCardZone(p1 ? p1PlayerEradication : p2PlayerEradication, p1 ? CARD_TARGET.P1_PLAYER_ERADICATION : CARD_TARGET.P2_PLAYER_ERADICATION, "Eradication")}
      </div>
      {renderHand(p1 ? p1PlayerHand : p2PlayerHand, p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND, p1)}
    </div>
  )
}