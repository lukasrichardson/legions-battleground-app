"use client";

import { useSocket } from "@/client/hooks/useSocket";
import {
  closeHelpModal,
  openImportDeckModal,
  setCreateRoomModalOpen, setJoinRoomModalOpen
} from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import useBackgroundPreload from "@/client/hooks/useBackgroundPreload";
import useIsMobile from "@/client/hooks/useIsMobile";
import { signIn, useSession } from "next-auth/react";
import {
  Download, 
  LogIn, Play,
  type LucideIcon
} from "lucide-react";
import { useEffect } from "react";
import RecentPublishedDecksPanel from "./components/RecentPublishedDecksPanel";
import ArenaShell from "./components/arena/ArenaShell";

const homeActionButtonClass = [
  "flex min-h-[46px] flex-col items-center justify-center gap-1 p-1",
  "cursor-pointer text-center text-[#eef4fa]",
  "transition-colors hover:bg-blue-400/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
  "sm:min-h-[84px] sm:flex-row sm:justify-start sm:gap-2.5 sm:p-3.5 sm:text-left",
].join(" ");

const homeActionButtonWithDividerClass = `${homeActionButtonClass} border-r border-white/20`;

const homeActionTitleClass = "font-serif text-[13px] font-medium text-[#f4f8fb] sm:text-base";
const homeActionDetailClass = "hidden text-[11px] leading-[1.3] text-[#d0dce6] sm:block";
const primaryButtonClass = [
  "inline-flex min-w-[195px] items-center justify-center gap-2 border border-[#8ecaff]",
  "cursor-pointer bg-gradient-to-tr from-slate-950 to-slate-800 text-slate-100 px-[25px] py-[14px]",
  "font-serif lg:text-[27px] font-semibold text-[#f7fbff]",
  "hover:shadow-[0_0_0_2px_rgba(79,169,255,.35),0_0_28px_rgba(79,169,255,.62)]",
  "transition-all",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
].join(" ");

type HomeActionTileProps = {
  title: string;
  detail: string;
  icon: LucideIcon;
  onClick: () => void;
  withDivider?: boolean;
};

function HomeActionTile({ title, detail, icon: Icon, onClick, withDivider = false }: HomeActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={withDivider ? homeActionButtonWithDividerClass : homeActionButtonClass}
    >
      <Icon size={19} />
      <span className="grid gap-[3px]">
        <strong className={homeActionTitleClass}>{title}</strong>
        <small className={homeActionDetailClass}>{detail}</small>
      </span>
    </button>
  );
}

export default function NewHome() {
  const dispatch = useAppDispatch();
  const { rooms } = useSocket();
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  useBackgroundPreload();

  useEffect(() => { dispatch(closeHelpModal()); }, [dispatch]);
  const roomList = Object.values(rooms);

  return <ArenaShell>
    <div className="mx-auto flex h-[calc(100dvh-64px)] min-h-0 w-[calc(100%-32px)] flex-col gap-3 overflow-hidden py-3 sm:h-[calc(100dvh-76px)] sm:w-[min(1380px,calc(100%-64px))] sm:gap-[clamp(14px,2.2vh,28px)] sm:pb-4 sm:pt-[clamp(40px,7vh,92px)] [@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:pt-2.5 [@media(max-height:600px)]:gap-1 [@media(max-height:600px)]:py-1.5">
      <section className="w-full flex flex-col text-shadow-[0_2px_5px_#000] md:flex-row md:items-end">
        <div className="w-full md:w-1/2">
          <h1 className="m-0 font-serif text-[27px] leading-[.98] tracking-[-.04em] sm:my-2.5 sm:text-[clamp(36px,5vw,66px)]">Legions Battleground</h1>
          <span className="hidden text-base leading-[1.55] sm:block">
            Build decks, practice in sandbox mode, and challenge other players.
          </span>
        </div>

      </section>
      <div className="flex min-h-0 w-full grow flex-col py-2 md:flex-row">
        <section className="h-fit max-h-full w-full border-b border-white/20 bg-[rgba(4,9,13,.66)] shadow-[0_15px_40px_rgba(0,0,0,.32)] backdrop-blur-[8px] md:w-1/2 px-2">
          <div className="flex flex-col items-start">
            <div className="flex justify-center items-center">
              {!isMobile && <>
                <button className={primaryButtonClass} type="button" onClick={() => session ? dispatch(setCreateRoomModalOpen(true)) : signIn()}>{session ? "Play" : "Enter The Battleground"} {session ? <Play size={26} /> : <LogIn size={26} />}</button>
              </>}
            </div>
            <div className="pt-2 w-full">
              <header className="flex items-center justify-between border-b border-white/15 p-3 sm:px-[17px] sm:py-[13px]">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[.16em] text-[#eef4fa]">Active Games</p>
                </div>
                <span className="text-xs text-[#eef4fa]"><i className="mb-px mr-[7px] inline-block size-[7px] rounded-full bg-[#4fa9ff] shadow-[0_0_8px_#4fa9ff]" />{roomList.length} active {roomList.length === 1 ? "room" : "rooms"}</span>
              </header>
              {roomList.length ? <div>{roomList.map((room) => <div className="grid min-h-[58px] grid-cols-[1fr_auto] items-center gap-2 border-b border-white/15 px-3 last:border-0 hover:bg-blue-400/10 sm:min-h-[52px] sm:grid-cols-[1fr_120px_75px_70px] sm:gap-0 sm:pl-[18px] sm:pr-3" key={room.id}>
                <strong className="text-sm text-[#e9f0f6]">{room.id}</strong>
                <span className="hidden text-[13px] text-[#e9f0f6] sm:block">{room.hostName || "Player"}</span>
                <span className="hidden text-[13px] text-[#e9f0f6] sm:block">{room.playerCount} players</span>
                {isMobile ? <span className="text-[11px] text-[#87bce9]">Larger screens to play</span> : <button className="cursor-pointer border border-[#4fa9ff] bg-[#246fb8] px-2 py-1.5 font-serif text-sm text-[#eaf5ff] shadow-[0_0_10px_rgba(79,169,255,.25)] transition-colors hover:bg-[#338de0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" type="button" onClick={() => session ? dispatch(setJoinRoomModalOpen(room.id)) : signIn()}>Join</button>}
              </div>)}
              </div> : <div className="p-[29px_18px] text-sm text-[#e1e8ee]">No active games right now. Create one when you are ready to play.</div>}
            </div>
          </div>
        </section>
        <section className="flex justify-center w-full min-h-[88px] flex-1 overflow-hidden sm:min-h-[130px] md:w-1/2 px-2"><RecentPublishedDecksPanel /></section>
      </div>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,980px)_auto] sm:items-end sm:gap-[30px] pb-12" aria-label="Deck and card tools">
        <div className={`grid w-full border-t border-white/25 backdrop-blur-[8px] ${session ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          {session && (
            <HomeActionTile
              title="Import deck"
              detail="Bring one in from Toolbox"
              icon={Download}
              onClick={() => dispatch(openImportDeckModal())}
            />
          )}
        </div>
        
      </section>

    </div>
  </ArenaShell>;
}
