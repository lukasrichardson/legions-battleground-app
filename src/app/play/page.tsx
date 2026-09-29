"use client";

import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { clearPileInView } from "@/client/redux/clientGameStateSlice";
import { closePlunderModal, closeToolsSettingsModal } from "@/client/redux/modalsSlice";
import { preloadSearchResults } from "@/client/utils/imagePreloader";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Suspense, useCallback, useEffect } from "react";
import PlayArea from "@/app/components/PlayArea/PlayArea";
import Toolbar from "../components/PlayArea/Toolbar";
import RegularMatchSetupOverlay from "../components/PlayArea/RegularMatchSetupOverlay";
import CardPileModal from "../components/Modals/CardPileModal";
import ToolsSettingsModal from "../components/Modals/ToolsSettingsModal";
import HelpModal from "../components/Modals/HelpModal";
import PlunderModal from "../components/Modals/PlunderModal";
import Modal from "../components/Modals/Modal";
import { useSocket } from "@/client/hooks/useSocket";
import { MatchStatus } from "@/shared/enums/Match";

function Page() {
  const gameState = useAppSelector((state) => state.gameState);
  const { side } = useAppSelector((state) => state.clientGameState);
  const { sequences, resolving } = useAppSelector((state) => state.sequenceState);
  const dispatch = useAppDispatch();
  const { joinError } = useSocket();
  const p1 = side === "p1";

  const closePileInView = useCallback(() => dispatch(clearPileInView()), [dispatch]);

  useEffect(() => {
    if (!gameState.started) return;
    const criticalImages = [
      ...gameState.p1PlayerWarriors.flat(), ...gameState.p1PlayerFortifieds.flat(), ...gameState.p1PlayerUnifieds.flat(),
      ...gameState.p2PlayerWarriors.flat(), ...gameState.p2PlayerFortifieds.flat(), ...gameState.p2PlayerUnifieds.flat(),
      ...gameState.p1PlayerWarlord, ...gameState.p1PlayerGuardian, ...gameState.p2PlayerWarlord, ...gameState.p2PlayerGuardian,
    ].filter(Boolean);
    if (criticalImages.length) preloadSearchResults(criticalImages.map((card) => ({ featured_image: card.img })));

    window.setTimeout(() => {
      const hand = p1 ? gameState.p1PlayerHand : gameState.p2PlayerHand;
      if (hand.length) preloadSearchResults(hand.map((card) => ({ featured_image: card.img })));
    }, 1000);

    window.setTimeout(() => {
      const backgroundImages = [
        ...gameState.p1PlayerDeck.slice(0, 5), ...gameState.p2PlayerDeck.slice(0, 5),
        ...gameState.p1PlayerDiscard.slice(0, 3), ...gameState.p2PlayerDiscard.slice(0, 3),
      ];
      if (backgroundImages.length) preloadSearchResults(backgroundImages.map((card) => ({ featured_image: card.img })));
    }, 5000);
  }, [gameState, gameState.started, p1]);

  const playerInputRequiredBlock = useCallback(() => {
    if (!resolving || !sequences.length || !sequences[0].items.length) return null;
    const waiting = sequences[0].items[0].effect[0].waitingForInput;
    if ((waiting?.p1 && p1) || (waiting?.p2 && !p1)) return <CardPileModal closeModal={closePileInView} />;
    return null;
  }, [closePileInView, p1, resolving, sequences]);

  return <div className="h-full w-full text-white">
    <main className="relative flex h-full w-full items-center justify-between">
      <DndProvider backend={HTML5Backend}>
        <Toolbar />
        <PlayArea />
        <CardPileModal closeModal={closePileInView} />
        <ToolsSettingsModal closeModal={() => dispatch(closeToolsSettingsModal())} />
        <HelpModal />
        <PlunderModal closeModal={() => dispatch(closePlunderModal())} />
        {joinError && <Modal open closeModal={() => null} modalHeader={<div className="py-3 text-xl font-bold text-white">Unable to join game</div>} modalContent={<div className="space-y-3 text-white"><p>{joinError}</p><p className="text-sm text-white/70">Regular matches require two different authenticated accounts. Return to the lobby and join with the other player’s account.</p></div>} />}
        {!gameState.sandboxMode && gameState.matchStatus === MatchStatus.Completed && gameState.result && <Modal open closeModal={() => null} modalHeader={<div className="py-3 text-xl font-bold text-white">Match complete</div>} modalContent={<div className="text-white">{gameState.result.kind === "draw" ? "The match ended in a draw." : `${gameState.result.winner === (p1 ? "p1" : "p2") ? "You win by concession." : "Your opponent wins by concession."}`}</div>} />}
        <RegularMatchSetupOverlay />
        {playerInputRequiredBlock()}
      </DndProvider>
    </main>
  </div>;
}

export default function BasePage() {
  return <Suspense><Page /></Suspense>;
}
