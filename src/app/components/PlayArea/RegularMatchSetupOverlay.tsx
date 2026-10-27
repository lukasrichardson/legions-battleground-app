"use client";

import { type ReactNode, useEffect, useState } from "react";
import AppIcon from "../AppIcon";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { openLeaveGameModal } from "@/client/redux/modalsSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { MatchStatus } from "@/shared/enums/Match";
import { PreGamePhase } from "@/shared/enums/Phases";

const setupSteps = ["Ready", "Rock Paper Scissors", "Turn order", "Mulligans", "Opening phases"];

export default function RegularMatchSetupOverlay() {
  const dispatch = useAppDispatch();
  const game = useAppSelector((state) => state.gameState);
  const { side } = useAppSelector((state) => state.clientGameState);
  const isP1 = side === "p1";
  const playerSide = isP1 ? "p1" : "p2";
  const myChoice = isP1 ? game.p1RPSChoice : game.p2RPSChoice;
  const isMyMulligan = (isP1 && game.currentPhase === PreGamePhase.P1Mulligan)
    || (!isP1 && game.currentPhase === PreGamePhase.P2Mulligan);
  const iGoFirst = game.firstPlayer === playerSide;
  const [pendingRpsChoice, setPendingRpsChoice] = useState<"Rock" | "Paper" | "Scissors" | null>(null);
  const [submittingRpsChoice, setSubmittingRpsChoice] = useState(false);
  const requestLeave = () => dispatch(openLeaveGameModal());

  useEffect(() => {
    setPendingRpsChoice(null);
    setSubmittingRpsChoice(false);
  }, [game.matchStatus, game.rpsTieCount]);

  useEffect(() => {
    if (myChoice) setSubmittingRpsChoice(false);
  }, [myChoice]);

  if (game.sandboxMode || game.matchStatus === MatchStatus.Completed) return null;

  const activeStep = game.matchStatus === MatchStatus.ReadyCheck ? 0
    : game.matchStatus === MatchStatus.Rps ? 1
      : game.matchStatus === MatchStatus.FirstPlayerChoice ? 2
        : game.matchStatus === MatchStatus.Mulligans ? 3 : 4;
  const progress = (
    <>
    <div aria-label={`Step ${activeStep + 1} of ${setupSteps.length}: ${setupSteps[activeStep]}`} className="mb-5 hidden border border-cyan-200/20 bg-cyan-300/[.06] px-3 py-2 text-xs font-semibold text-cyan-100 max-[1100px]:block"><span aria-hidden="true">Step {activeStep + 1} of {setupSteps.length}</span></div>
    <ol className="mb-6 grid grid-cols-5 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide max-[1100px]:hidden sm:text-xs">
      {setupSteps.map((step, index) => (
        <li key={step} aria-current={index === activeStep ? "step" : undefined} className={index === activeStep ? "text-cyan-100" : index < activeStep ? "text-emerald-200" : "text-white/35"}>
          <span className={`mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${index === activeStep ? "bg-cyan-400 text-slate-950 ring-2 ring-cyan-100/50" : index < activeStep ? "bg-emerald-500/80 text-slate-950" : "bg-white/10 text-white/50"}`}>{index < activeStep ? "✓" : index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
    </>
  );

  if (game.matchStatus === MatchStatus.ReadyCheck) {
    const ready = game.readyPlayers[isP1 ? "p1" : "p2"];
    return <BlockingPanel onLeave={requestLeave}>{progress}
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
    return <BlockingPanel onLeave={requestLeave}>{progress}
      <PanelHeading icon={null} title="Rock Paper Scissors" />
      {myChoice ? <WaitingMessage message={`Choice locked: ${myChoice}. Waiting for your opponent.`} /> : <>
        {game.rpsTieCount > 0 ? <div role="status" aria-live="assertive" className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">That round was a tie. Choose again.</div> : null}
        <div role="radiogroup" aria-label="Choose Rock, Paper, or Scissors" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RpsChoice label="Rock" selected={pendingRpsChoice === "Rock"} icon={<AppIcon name="rock" size={25} />} onChange={() => setPendingRpsChoice("Rock")} />
          <RpsChoice label="Paper" selected={pendingRpsChoice === "Paper"} icon={<AppIcon name="paper" size={25} />} onChange={() => setPendingRpsChoice("Paper")} />
          <RpsChoice label="Scissors" selected={pendingRpsChoice === "Scissors"} icon={<AppIcon name="scissors" size={25} />} onChange={() => setPendingRpsChoice("Scissors")} />
        </div>
        <PrimaryButton disabled={!pendingRpsChoice || submittingRpsChoice} onClick={() => {
          if (!pendingRpsChoice || submittingRpsChoice) return;
          setSubmittingRpsChoice(true);
          emitGameEvent({ type: GAME_EVENT.setRpsChoice, data: pendingRpsChoice });
        }}>{submittingRpsChoice ? "Locking in…" : "Lock in choice"}</PrimaryButton>
      </>}
    </BlockingPanel>;
  }

  if (game.matchStatus === MatchStatus.FirstPlayerChoice && game.rpsWinner) {
    const iWonRps = game.rpsWinner === (isP1 ? "p1" : "p2");
    return <BlockingPanel onLeave={requestLeave}>{progress}
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
      <div className="mb-3 flex items-center justify-between gap-2 text-cyan-200"><span className="flex items-center gap-2"><AppIcon name="mulligan-hand" size={20} /><span className="font-semibold">Mulligan</span></span><LeaveSetupButton onClick={requestLeave} /></div>
      {isMyMulligan ? <>
        <p className="text-sm text-slate-200">Review your hand, then choose whether to mulligan or keep.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => emitGameEvent({ type: GAME_EVENT.mulligan, data: {} })} className="flex min-h-12 items-center justify-center border border-sky-200/45 bg-[#246fb8] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] transition hover:bg-[#338de0] focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-slate-950">Mulligan</button>
          <button type="button" onClick={() => emitGameEvent({ type: GAME_EVENT.keepHand, data: {} })} className="flex min-h-12 items-center justify-center border border-sky-200/25 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-200/60 hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-sky-200">Keep hand</button>
        </div>
      </> : <WaitingMessage message={iGoFirst
        ? "You will go first. Your opponent is deciding whether to mulligan."
        : "Your opponent will go first and is deciding whether to mulligan."
      } />}
    </aside>;
  }

  return null;
}

function BlockingPanel({ children, onLeave }: { children: ReactNode; onLeave: () => void }) {
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(52,136,205,.22),transparent_42%),rgba(1,5,10,.82)] p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-label="Regular match setup" className="max-h-full w-full max-w-xl overflow-y-auto border border-sky-200/35 bg-[linear-gradient(145deg,rgba(15,31,48,.99),rgba(3,10,18,.99))] p-4 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,.55),0_0_28px_rgba(79,169,255,.16)]">
      <div className="mb-3 flex justify-end"><LeaveSetupButton onClick={onLeave} /></div>
      {children}
    </section>
  </div>;
}

function LeaveSetupButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-11 border border-rose-200/30 bg-rose-500/5 px-3 text-xs font-semibold text-rose-100 transition hover:border-rose-200/55 hover:bg-rose-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200">Leave match</button>;
}

function PanelHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="flex items-center gap-3 border-b border-sky-200/20 pb-4 text-white">{icon &&<span className="border border-sky-200/40 bg-sky-300/15 p-2 text-sky-100">{icon}</span>}<h2 className="text-lg font-semibold tracking-wide">{title}</h2></div>;
}

function Seat({ label, ready }: { label: string; ready: boolean }) {
  return <div className="border border-sky-200/15 bg-slate-950/35 p-3"><div className="font-semibold text-white">{label}</div><div className={ready ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-slate-400"}>{ready ? "Ready" : "Not ready"}</div></div>;
}

function WaitingMessage({ message }: { message: string }) {
  return <div className="mt-5 border border-sky-200/20 bg-sky-300/10 p-4 text-sm text-sky-100" role="status">{message}</div>;
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mt-5 w-full border border-sky-200/45 bg-[#246fb8] px-4 py-3 font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] transition hover:bg-[#338de0] focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none">{children}</button>;
}

function ChoiceButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-12 border border-sky-200/25 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-200/60 hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-sky-200">{children}</button>;
}

function RpsChoice({ label, icon, selected, onChange }: { label: "Rock" | "Paper" | "Scissors"; icon: ReactNode; selected: boolean; onChange: () => void }) {
  return <label className="relative block min-h-24 cursor-pointer">
    <input type="radio" name="rps-choice" value={label} aria-label={label} checked={selected} onChange={onChange} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
    <span className={`pointer-events-none block min-h-24 border p-4 text-left transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-200 ${selected ? "border-cyan-100 bg-cyan-300/20 ring-2 ring-cyan-200/45" : "border-sky-200/25 bg-slate-950/35 peer-hover:border-sky-200/60 peer-hover:bg-blue-400/10"}`}>
      <span className="mb-3 block text-sky-200" aria-hidden="true">{icon}</span>
      <span className="font-semibold text-white">{label}</span>
      {selected && <span className="mt-1 block text-xs text-cyan-100" aria-hidden="true">Selected</span>}
    </span>
  </label>;
}
