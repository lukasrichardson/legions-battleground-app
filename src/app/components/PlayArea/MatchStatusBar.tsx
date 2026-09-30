import { GamePhase, PreGamePhase } from "@/shared/enums/Phases";
import { MatchStatus, PlayerSide } from "@/shared/enums/Match";

export default function MatchStatusBar({ status, phase, turn, activeSide, canAdvance, onAdvance, variant = "toolbar" }: {
  status: MatchStatus;
  phase: PreGamePhase | GamePhase;
  turn: number;
  activeSide: PlayerSide | null;
  canAdvance: boolean;
  onAdvance: () => void;
  variant?: "toolbar" | "board";
}) {
  const statusLabel: Record<MatchStatus, string> = {
    [MatchStatus.ReadyCheck]: "Match setup",
    [MatchStatus.Rps]: "Rock Paper Scissors",
    [MatchStatus.FirstPlayerChoice]: "Choose turn order",
    [MatchStatus.Mulligans]: "Opening hands",
    [MatchStatus.PreGame]: "Opening phases",
    [MatchStatus.InProgress]: "Match in progress",
    [MatchStatus.Completed]: "Match complete",
  };
  const activeLabel = activeSide ? (canAdvance ? "Your action" : "Opponent's action") : null;

  if (variant === "board") {
    return <section aria-label="Regular match status" className="h-full w-full border-y border-cyan-200/15 bg-cyan-950/30 px-4 text-xs text-slate-200 shadow-[0_0_24px_rgba(8,145,178,0.08)]">
      <div className="grid h-full grid-cols-[minmax(9rem,1fr)_minmax(12rem,1.4fr)_minmax(12rem,1fr)] items-center gap-4">
        <div className="min-w-0">
          <div className="truncate font-bold text-white">{statusLabel[status]}</div>
          {activeLabel ? <div className={canAdvance ? "mt-0.5 text-cyan-200" : "mt-0.5 text-slate-400"}>{activeLabel}</div> : null}
        </div>
        <div className="min-w-0 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/60">Current phase</div>
          <div className="truncate text-base font-bold text-cyan-100">{phase}</div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {turn ? <span className="whitespace-nowrap rounded bg-white/10 px-2 py-1 text-[10px] font-semibold">Turn {turn}</span> : null}
          {canAdvance && <button type="button" onClick={onAdvance} className="whitespace-nowrap rounded-lg bg-cyan-400 px-3 py-2 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100">Advance phase</button>}
        </div>
      </div>
    </section>;
  }

  return <section aria-label="Regular match status" className="mb-3 w-full rounded-xl border border-cyan-200/15 bg-cyan-950/30 p-3 text-xs text-slate-200">
    <div className="flex items-center justify-between gap-2"><span className="font-bold text-white">{statusLabel[status]}</span>{turn ? <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">Turn {turn}</span> : null}</div>
    <div className="mt-2 text-slate-300">{phase}</div>
    {activeLabel ? <div className={canAdvance ? "mt-2 text-cyan-200" : "mt-2 text-slate-400"}>{activeLabel}</div> : null}
    {canAdvance && <button type="button" onClick={onAdvance} className="mt-3 w-full rounded-lg bg-cyan-400 px-2 py-2 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100">Advance phase</button>}
  </section>;
}
