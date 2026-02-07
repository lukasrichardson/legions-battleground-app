"use client";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { clearPileInView } from "@/client/redux/gameStateSlice";
import { closePlunderModal, closeSetDecksModal } from "@/client/redux/modalsSlice";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PlayArea from "@/app/components/PlayArea/PlayArea";
import CardPileModal from "../components/Modals/CardPileModal";
// import CardPreview from "../components/Card/CardPreview";
import Toolbar from "../components/PlayArea/Toolbar";
import SetDecksModal from "../components/Modals/SetDecksModal";
import { useSocket } from "@/client/hooks/useSocket";
import { Suspense, useCallback, useEffect, useState } from "react";
import HelpModal from "../components/Modals/HelpModal";
import PlunderModal from "../components/Modals/PlunderModal";
import Modal from "../components/Modals/Modal";
import { PreGamePhase } from "@/client/redux/phaseSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/client/enums/GameEvent";
import { preloadGameImages } from "@/client/utils/imagePreloader";

function Page() {
  const gameState = useAppSelector((state) => state.gameState);
  const sequeunceState = useAppSelector((state) => state.sequenceState);
  const { sequences, resolving } = sequeunceState;
  const [phaseTriggerModal, setPhaseTriggerModal] = useState(true);
  const [rpsResultModal, setRpsResultModal] = useState(false);
  const dispatch = useAppDispatch();
  const phaseState = useAppSelector(state => state.phaseState);
  const { currentPhase, rpsWinner, p1RPSChoice, p2RPSChoice } = phaseState;
  useSocket();

  const closePileInView = useCallback(() => {
    dispatch(clearPileInView());
  }, [dispatch]);

  const handleCloseSetDecksModal = () => {
    dispatch(closeSetDecksModal());
  }
  const handleClosePlunderModal = () => {
    dispatch(closePlunderModal());
  }

  useEffect(() => {
    setPhaseTriggerModal(true);
  }, [currentPhase]);

  useEffect(() => {
    if (rpsWinner) {
      setRpsResultModal(true);
    }
  }, [rpsWinner]);

  const { side } = gameState;
  const p1 = side === "p1";
  const mulliganPhase = p1 ? currentPhase === PreGamePhase.P1Mulligan : currentPhase === PreGamePhase.P2Mulligan;

  // Determine if phase modals should be shown (not in sandbox mode)
  const showPhaseModals = !gameState.game.sandboxMode;

  // Preload game images when game state is available
  useEffect(() => {
    if (gameState.game) {
      console.log('[PlayArea] Preloading game images');
      try {
        preloadGameImages(gameState.game);
      } catch (error) {
        console.warn('[PlayArea] Preload failed:', error);
      }
    }
  }, [gameState.game]);

  const rpsContent = useCallback(() => {
    const hasChosen = p1 ? !!p1RPSChoice : !!p2RPSChoice;
    const choiceText = p1 ? p1RPSChoice : p2RPSChoice;

    const ChoiceButton = ({ label, icon, onClick, active }: { label: string; icon: JSX.Element; onClick: () => void; active: boolean }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={hasChosen}
        className={`group relative flex items-center gap-3 w-full rounded-xl p-4 border transition-all
        ${active ? 'border-blue-500 bg-blue-500/10' : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'}
        ${hasChosen && !active ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-pressed={active}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? 'bg-blue-600' : 'bg-white/10'} text-white`}>
          {icon}
        </div>
        <span className="text-white font-medium">{label}</span>
        {active && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-300">selected</span>
        )}
      </button>
    );

    return (
      <div className="space-y-6">
        {!hasChosen && (
          <p className="text-gray-300 text-sm">Choose one of the following:</p>
        )}

        {/* Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ChoiceButton
            label="Rock"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6l4 6-7 12-7-12 4-6z" />
              </svg>
            }
            onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: 'Rock' })}
            active={choiceText === 'Rock'}
          />
          <ChoiceButton
            label="Paper"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
              </svg>
            }
            onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: 'Paper' })}
            active={choiceText === 'Paper'}
          />
          <ChoiceButton
            label="Scissors"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
              </svg>
            }
            onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: 'Scissors' })}
            active={choiceText === 'Scissors'}
          />
        </div>

        {/* Status */}
        {hasChosen && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-gray-300">
              You chose <span className="font-semibold text-white">{choiceText}</span>. Waiting for opponent...
            </p>
          </div>
        )}
      </div>
    );
  }, [p1, p1RPSChoice, p2RPSChoice]);

  const rpsPhaseBlock = useCallback(() => {
    return <>
      {currentPhase === PreGamePhase.RPS && (
        <Modal
          open={phaseTriggerModal}
          closeModal={function (): void { setPhaseTriggerModal(false) }}
          modalHeader={
            <div className="flex items-center justify-between w-full p-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3h6l4 6-7 12-7-12 4-6z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Rock Paper Scissors</span>
              </div>
              <button
                onClick={() => setPhaseTriggerModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
          modalContent={<div className="p-1">{rpsContent()}</div>}
        />
      )}

      {rpsResultModal && (
        <Modal
          open={rpsResultModal}
          closeModal={function (): void { setRpsResultModal(false) }}
          modalHeader={
            <div className="flex items-center justify-between w-full p-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">RPS Result</span>
              </div>
              <button
                onClick={() => setRpsResultModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
          modalContent={
            <div className="space-y-3">
              {rpsWinner ? (
                <p className="text-white text-base">
                  <span className="font-semibold">{rpsWinner}</span> wins RPS!
                </p>
              ) : (
                <p className="text-gray-300 text-base">No winner yet.</p>
              )}
            </div>
          }
        />
      )}
    </>
  }, [currentPhase, phaseTriggerModal, rpsContent, rpsResultModal, rpsWinner]);

  const mulliganPhaseBlock = useCallback(() => {
    return (
      <>
        {mulliganPhase && (
          <Modal
            open={mulliganPhase}
            closeModal={() => null}
            modalHeader={
              <div className="flex items-center w-full p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v6h6" />
                      <path d="M20 20v-6h-6" />
                      <path d="M20 8a8 8 0 00-8-8v0" />
                      <path d="M4 16a8 8 0 008 8v0" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-white">Mulligan</span>
                </div>
              </div>
            }
            modalContent={
              <div className="space-y-5">
                <p className="text-gray-300 text-sm">
                  Would you like to mulligan your starting hand?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => emitGameEvent({ type: GAME_EVENT.mulligan, data: {} })}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Yes, Mulligan
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => emitGameEvent({ type: GAME_EVENT.nextPhase, data: {} })}
                    className="w-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Keep Hand
                    </span>
                  </button>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-400">
                    Mulligan replaces your starting hand based on game rules.
                  </p>
                </div>
              </div>
            }
          />
        )}
      </>
    );
  }, [mulliganPhase]);

  const playerInputRequiredBlock = useCallback(() => {
    if (resolving && sequences.length) {
      if (sequences[0].items.length) {
        if (sequences[0].items[0].effect[0].waitingForInput?.p1 && p1 || sequences[0].items[0].effect[0].waitingForInput?.p2 && !p1) {
          return (
            <CardPileModal closeModal={closePileInView} />
          );
        } else if (sequences[0].items[0].effect[0].waitingForInput?.controller) {
//todo
        }
      }
    }

  }, [resolving, sequences, p1, closePileInView]);

  return (
    <div className="text-white h-full w-full">
      
      <main className="relative flex justify-between items-center h-full w-full">
        <Toolbar />
        <DndProvider backend={HTML5Backend}>
          <PlayArea />
          <CardPileModal closeModal={closePileInView} />
          <SetDecksModal closeModal={handleCloseSetDecksModal} />
          {/* <CardPreview /> */}
          <HelpModal />
          <PlunderModal
            closeModal={handleClosePlunderModal}
          />
          {/* Conditionally show phase modals based on sandbox mode */}
          {showPhaseModals && rpsPhaseBlock()}
          {showPhaseModals && mulliganPhaseBlock()}
          {playerInputRequiredBlock()}
        </DndProvider>
      </main>
    </div>
  );
}

export default function BasePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  )
}
