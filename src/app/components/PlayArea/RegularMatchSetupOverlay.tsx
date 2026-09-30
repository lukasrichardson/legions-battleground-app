"use client";

import { type ReactNode } from "react";
import { Circle, Hand, Scissors, ScrollText } from "lucide-react";
import { useAppSelector } from "@/client/redux/hooks";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { MatchStatus } from "@/shared/enums/Match";
import { PreGamePhase } from "@/shared/enums/Phases";

const setupSteps = ["Ready", "RPS", "Turn order", "Mulligans", "Opening phases"];

export default function RegularMatchSetupOverlay() {
  const game = useAppSelector((state) => state.gameState);
  const { side } = useAppSelector((state) => state.clientGameState);
  const isP1 = side === "p1";
  const playerSide = isP1 ? "p1" : "p2";
  const myChoice = isP1 ? game.p1RPSChoice : game.p2RPSChoice;
  const isMyMulligan = (isP1 && game.currentPhase === PreGamePhase.P1Mulligan)
    || (!isP1 && game.currentPhase === PreGamePhase.P2Mulligan);
  const iGoFirst = game.firstPlayer === playerSide;

  if (game.sandboxMode || game.matchStatus === MatchStatus.Completed) return null;

  const activeStep = game.matchStatus === MatchStatus.ReadyCheck ? 0
    : game.matchStatus === MatchStatus.Rps ? 1
      : game.matchStatus === MatchStatus.FirstPlayerChoice ? 2
        : game.matchStatus === MatchStatus.Mulligans ? 3 : 4;
  const progress = (
    <ol className="mb-6 grid grid-cols-5 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
      {setupSteps.map((step, index) => (
        <li key={step} className={index <= activeStep ? "text-cyan-200" : "text-white/35"}>
          <span className={`mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${index <= activeStep ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-white/50"}`}>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );

  if (game.matchStatus === MatchStatus.ReadyCheck) {
    const ready = game.readyPlayers[isP1 ? "p1" : "p2"];
    return <BlockingPanel>{progress}
      <PanelHeading icon={null} title="Ready Up" />
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Seat label="You" ready={ready} />
        <Seat label="Opponent" ready={game.readyPlayers[isP1 ? "p2" : "p1"]} />
      </div>
      {ready ? <WaitingMessage message="You are ready. Waiting for your opponent." /> : (
        <PrimaryButton onClick={() => emitGameEvent({ type: GAME_EVENT.readyForMatch, data: null })}>Ready</PrimaryButton>
      )}
    </BlockingPanel>;
  }

  if (game.matchStatus === MatchStatus.Rps) {
    return <BlockingPanel>{progress}
      <PanelHeading icon={null} title="Rock Paper Scissors" />
      {myChoice ? <WaitingMessage message={`Choice locked: ${myChoice}. Waiting for your opponent.`} /> : <>
        {game.rpsTieCount > 0 ? <div role="status" aria-live="assertive" className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">That round was a tie. Choose again.</div> : null}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RpsChoice label="Rock" icon={<Circle size={25} />} onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: "Rock" })} />
          <RpsChoice label="Paper" icon={<ScrollText size={25} />} onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: "Paper" })} />
          <RpsChoice label="Scissors" icon={<Scissors size={25} />} onClick={() => emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: "Scissors" })} />
        </div>
      </>}
    </BlockingPanel>;
  }

  if (game.matchStatus === MatchStatus.FirstPlayerChoice && game.rpsWinner) {
    const iWonRps = game.rpsWinner === (isP1 ? "p1" : "p2");
    return <BlockingPanel>{progress}
      <PanelHeading icon={null} title="Choose turn order" />
      {iWonRps ? <>
        <p className="mt-3 text-sm text-slate-200">You won Rock Paper Scissors. Choose who takes the first turn.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ChoiceButton onClick={() => emitGameEvent({ type: GAME_EVENT.chooseFirstPlayer, data: "first" })}>Go first</ChoiceButton>
          <ChoiceButton onClick={() => emitGameEvent({ type: GAME_EVENT.chooseFirstPlayer, data: "second" })}>Go second</ChoiceButton>
        </div>
      </> : <WaitingMessage message="Your opponent won Rock Paper Scissors and is choosing who goes first." />}
    </BlockingPanel>;
  }

  if (game.matchStatus === MatchStatus.Mulligans) {
    return <aside role="status" aria-live="polite" className="absolute left-1/2 top-1/2 z-40 w-[min(26rem,calc(100%-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-300/25 bg-slate-950/95 p-5 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-cyan-200"><Hand size={20} /><span className="font-semibold">Mulligan</span></div>
      {isMyMulligan ? <>
        <p className="text-sm text-slate-200">Review your hand, then choose whether to mulligan or keep.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => emitGameEvent({ type: GAME_EVENT.mulligan, data: {} })} className="flex min-h-12 items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-2 focus:ring-offset-slate-950">Mulligan</button>
          <button type="button" onClick={() => emitGameEvent({ type: GAME_EVENT.keepHand, data: {} })} className="flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300">Keep hand</button>
        </div>
      </> : <WaitingMessage message={iGoFirst
        ? "You will go first. Your opponent is deciding whether to mulligan."
        : "Your opponent will go first and is deciding whether to mulligan."
      } />}
    </aside>;
  }

  return null;
}

function BlockingPanel({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-label="Regular match setup" className="w-full max-w-xl rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-6 shadow-2xl">
      {children}
    </section>
  </div>;
}

function PanelHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="flex items-center gap-3 text-white">{icon &&<span className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200">{icon}</span>}<h2 className="text-xl font-bold">{title}</h2></div>;
}

function Seat({ label, ready }: { label: string; ready: boolean }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="font-semibold text-white">{label}</div><div className={ready ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-slate-400"}>{ready ? "Ready" : "Not ready"}</div></div>;
}

function WaitingMessage({ message }: { message: string }) {
  return <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-4 text-sm text-cyan-100" role="status">{message}</div>;
}

function PrimaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-2 focus:ring-offset-slate-950">{children}</button>;
}

function ChoiceButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-200/60 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-200">{children}</button>;
}

function RpsChoice({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:border-cyan-200/60 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-200"><span className="mb-3 block text-cyan-200">{icon}</span><span className="font-semibold text-white">{label}</span></button>;
}
