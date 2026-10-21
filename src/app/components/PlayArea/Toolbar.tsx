"use client";

import {
  openConcedeModal,
  openHelpModal,
  openLeaveGameModal,
  openToolsSettingsModal,
} from "@/client/redux/modalsSlice";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { ROOM_EVENT } from "@/shared/enums/RoomEvent";
import { emitGameEvent, emitRoomEvent } from "@/client/utils/emitEvent";
import { resetState } from "@/client/redux/gameStateSlice";
import { socket } from "@/client/socket";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FolderSearch, Home, LogIn, LogOut, Menu, MessageSquare, PlayingCardsFan,
  Settings2, UserRound, WalletCards, X,
} from "lucide-react";
import CardPreview from "../Card/CardPreview";
import AppIcon, { AppIconName } from "../AppIcon";

type Panel = "inspect" | "activity" | "menu" | null;

const actionButtonClass =
  "grid min-h-11 w-full place-items-center border border-sky-200/20 bg-slate-950/45 px-2 text-[11px] font-semibold text-slate-100 transition hover:border-sky-200/55 hover:bg-blue-400/15 focus:outline-none focus:ring-2 focus:ring-sky-200 touch-feedback";

const navigationLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/decks", label: "Decks", icon: WalletCards },
  { href: "/browse", label: "Browse", icon: FolderSearch },
  { href: "/cards", label: "Cards", icon: PlayingCardsFan },
];

interface ActionButtonProps {
  onClick: () => void;
  text?: string;
  icon?: AppIconName;
  label?: string;
  disabled?: boolean;
  tone?: string;
}

function ActionButton({ text, icon, label, disabled = false, tone = "", onClick }: ActionButtonProps) {
  const stateClass = disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer";

  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label || text} className={`${actionButtonClass} ${tone} ${stateClass}`}>
      <span className="flex items-center gap-1.5">
        {icon && <AppIcon name={icon} size={15} />}
        {text && <span>{text}</span>}
      </span>
    </button>
  );
}

interface RailButtonProps {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}

function RailButton({ label, icon, active, onClick }: RailButtonProps) {
  const stateClass = active
    ? "border-sky-200/65 bg-blue-400/20 text-sky-100"
    : "border-sky-200/15 bg-slate-950/45 text-slate-300 hover:bg-blue-400/10";

  return (
    <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={`grid size-11 place-items-center border touch-feedback ${stateClass}`}>
      {icon}
    </button>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[.14em] text-sky-100/70">
      <span>{title}</span>
      <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid min-h-11 min-w-11 place-items-center touch-feedback"><X size={17} /></button>
    </div>
  );
}

export default function Toolbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: session } = useSession();
  const game = useAppSelector((state) => state.gameState);
  const { side, gameHistory, undoneHistory } = useAppSelector((state) => state.clientGameState);
  const [panel, setPanel] = useState<Panel>(null);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const isRegularMatch = !game.sandboxMode;
  const isPlayerOne = side === "p1";
  const hasOpponentDrawOffer = isRegularMatch && game.drawOffer !== null && game.drawOffer.offeredBy !== side;
  const activityHeight = activityCollapsed ? "h-8" : "h-[190px]";

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [game.gameLog.length]);

  const closePanel = () => setPanel(null);
  const togglePanel = (nextPanel: Exclude<Panel, null>) => {
    setPanel((currentPanel) => currentPanel === nextPanel ? null : nextPanel);
  };
  const handleRollDie = () => emitGameEvent({ type: GAME_EVENT.rollDie, data: { side } });

  const handleNavigate = (href: string) => {
    closePanel();
    if (isRegularMatch) {
      dispatch(openLeaveGameModal());
      return;
    }
    socket.disconnect();
    dispatch(resetState());
    router.push(href);
  };

  const handleChatKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    emitGameEvent({ type: GAME_EVENT.sendChatMessage, data: { message: event.currentTarget.value, side } });
    event.currentTarget.value = "";
  };

  const matchActions = (
    <>
      {!isRegularMatch && (
        <div className="grid grid-cols-2 gap-1">
          <ActionButton text="Mulligan" icon="mulligan" onClick={() => emitGameEvent({ type: GAME_EVENT.mulligan, data: null })} />
          <ActionButton text={`Switch to ${isPlayerOne ? "P2" : "P1"}`} icon="switch-player" onClick={() => emitRoomEvent({ type: ROOM_EVENT.switchSide, data: null })} />
        </div>
      )}
      {isRegularMatch && (
        <div className="grid grid-cols-2 gap-1">
          <ActionButton
            text={game.drawOffer?.offeredBy === side ? "Rescind draw" : "Offer draw"}
            disabled={Boolean(game.drawOffer && game.drawOffer.offeredBy !== side)}
            onClick={() => emitGameEvent({ type: game.drawOffer?.offeredBy === side ? GAME_EVENT.rescindDrawOffer : GAME_EVENT.offerDraw, data: null })}
          />
          <ActionButton text="Concede" tone="text-rose-100" onClick={() => dispatch(openConcedeModal())} />
        </div>
      )}
      {!isRegularMatch && (
        <div className="grid grid-cols-2 gap-1">
          <ActionButton text="Undo" disabled={gameHistory.length === 0} onClick={() => emitGameEvent({ type: GAME_EVENT.undo, data: null })} />
          <ActionButton text="Redo" disabled={undoneHistory.length === 0} onClick={() => emitGameEvent({ type: GAME_EVENT.redo, data: null })} />
        </div>
      )}
      <ActionButton text="Leave match" icon="leave-game" tone="text-rose-100" onClick={() => handleNavigate("/")} />
    </>
  );

  const activity = (
    <>
      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto border-x border-b border-sky-200/15 bg-[linear-gradient(180deg,rgba(7,18,29,.66),rgba(3,10,18,.42))] px-2 py-1.5 sidebar-scrollbar">
        {game.gameLog.length ? game.gameLog.map((entry, index) => (
          <div key={index} className="relative border-l border-sky-300/35 py-1 pl-2.5 text-[11px] leading-snug text-slate-300 before:absolute before:-left-[3px] before:top-2.5 before:size-1 before:rounded-full before:bg-sky-300/70">
            {entry}
          </div>
        )) : (
          <p className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-500">No recent match activity.</p>
        )}
      </div>
      <textarea aria-label="Match chat" placeholder="Message opponent — Enter to send" className="mt-1.5 min-h-11 max-h-[72px] w-full resize-none border border-sky-200/15 bg-slate-950/55 px-2.5 py-2 text-xs leading-4 text-white placeholder:text-slate-500 focus:border-sky-200/60 focus:outline-none" onKeyDown={handleChatKeyDown} />
      {hasOpponentDrawOffer && (
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <ActionButton text="Accept draw" onClick={() => emitGameEvent({ type: GAME_EVENT.acceptDrawOffer, data: null })} />
          <ActionButton text="Decline" onClick={() => emitGameEvent({ type: GAME_EVENT.declineDrawOffer, data: null })} />
        </div>
      )}
    </>
  );

  const navigationMenu = (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 text-sm sidebar-scrollbar">
      <div className="flex items-center justify-between border-b border-sky-200/20 pb-3">
        <span className="font-serif text-base">Legions Battleground</span>
        <button type="button" aria-label="Close menu" onClick={closePanel}><X size={18} /></button>
      </div>
      {navigationLinks.map(({ href, label, icon: Icon }) => (
        <button key={href} type="button" onClick={() => handleNavigate(href)} className="flex items-center gap-3 px-3 py-2 text-left text-slate-200 hover:bg-blue-400/10">
          <Icon size={17} className="text-sky-300" />{label}
        </button>
      ))}
      <div className="border-t border-sky-200/15 pt-2">
        <button type="button" onClick={() => dispatch(openHelpModal())} className="flex items-center gap-3 px-3 py-2 text-slate-300"><Settings2 size={17} className="text-sky-300" />Help</button>
        {!isRegularMatch && <button type="button" onClick={() => dispatch(openToolsSettingsModal())} className="flex items-center gap-3 px-3 py-2 text-slate-300"><Settings2 size={17} className="text-sky-300" />Tools & settings</button>}
      </div>
      <div className="space-y-1.5 border-t border-sky-200/15 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-sky-100/60">Match actions</div>
        {matchActions}
      </div>
      <div className="mt-auto border-t border-sky-200/15 pt-3">
        {session ? (
          <button type="button" onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2 text-slate-300"><LogOut size={17} />Sign out</button>
        ) : (
          <button type="button" onClick={() => signIn()} className="flex items-center gap-3 px-3 py-2 text-slate-300"><LogIn size={17} />Sign in</button>
        )}
        <div className="mt-2 flex items-center gap-2 px-3 text-xs text-slate-500"><UserRound size={14} />{session?.user?.name || session?.user?.email || "Guest"}</div>
      </div>
    </div>
  );

  const desktopToolbar = (
    <div className="flex h-full w-full flex-col gap-2 max-[1100px]:hidden">
      <section className="min-h-[250px] flex-1 overflow-hidden border border-sky-200/15 bg-slate-950/40"><CardPreview /></section>
      <section className={`${activityHeight} shrink-0 flex flex-col overflow-hidden`}>
        <button type="button" onClick={() => setActivityCollapsed((collapsed) => !collapsed)} className="flex h-8 shrink-0 items-center justify-between border border-sky-200/15 bg-slate-950/60 px-2 text-[10px] font-semibold uppercase tracking-[.12em] text-sky-100/70">
          <span>Activity</span><span className="flex gap-2"><span className="text-sky-200/50">{game.gameLog.length}</span><span>{activityCollapsed ? "+" : "−"}</span></span>
        </button>
        {!activityCollapsed && <div className="flex min-h-0 flex-1 flex-col">{activity}</div>}
      </section>
      <section className="mt-auto space-y-1.5 border-t border-sky-200/15 pt-2">
        <div className="grid grid-cols-4 gap-1">
          <ActionButton icon="more" label="Open navigation" onClick={() => togglePanel("menu")} />
          <ActionButton icon="roll-d6" label="Roll D6" onClick={handleRollDie} />
          <ActionButton icon="help" label="Help" onClick={() => dispatch(openHelpModal())} />
          {!isRegularMatch && <ActionButton icon="tools" label="Tools & settings" onClick={() => dispatch(openToolsSettingsModal())} />}
        </div>
        {matchActions}
      </section>
    </div>
  );

  const compactToolbar = (
    <div className="hidden h-full w-full flex-col justify-between max-[1100px]:flex">
      <div className="grid gap-1">
        <RailButton label="Inspect card" icon={<PlayingCardsFan size={18} />} active={panel === "inspect"} onClick={() => togglePanel("inspect")} />
        <RailButton label="Match log and chat" icon={<MessageSquare size={18} />} active={panel === "activity"} onClick={() => togglePanel("activity")} />
      </div>
      <div className="grid gap-1">
        <RailButton label="Open navigation" icon={<Menu size={19} />} active={panel === "menu"} onClick={() => togglePanel("menu")} />
        <RailButton label="Roll D6" icon={<AppIcon name="roll-d6" size={18} />} active={false} onClick={handleRollDie} />
      </div>
    </div>
  );

  let panelContent: ReactNode = null;
  if (panel === "inspect") {
    panelContent = <div className="h-full p-3"><PanelHeader title="Card inspector" onClose={closePanel} /><div className="h-[calc(100%-2rem)] overflow-hidden border border-sky-200/15"><CardPreview /></div></div>;
  } else if (panel === "activity") {
    panelContent = <div className="flex h-full flex-col p-3"><PanelHeader title="Activity" onClose={closePanel} /><div className="flex min-h-0 flex-1 flex-col">{activity}</div></div>;
  } else if (panel === "menu") {
    panelContent = navigationMenu;
  }

  return (
    <aside className="relative z-30 flex h-full w-[248px] shrink-0 border-r border-sky-200/15 bg-[linear-gradient(180deg,rgba(9,21,34,.97),rgba(3,10,18,.98))] p-2 text-white shadow-[12px_0_32px_rgba(0,0,0,.2)] max-[1100px]:w-14 max-[1100px]:p-1.5">
      {desktopToolbar}
      {compactToolbar}
      {panelContent && <section className="absolute left-full top-0 h-full w-[min(320px,calc(100vw-56px))] border-r border-sky-200/25 bg-[linear-gradient(160deg,rgba(12,29,45,.99),rgba(2,8,14,.99))] shadow-[18px_0_42px_rgba(0,0,0,.48)]">{panelContent}</section>}
    </aside>
  );
}
