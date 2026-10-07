"use client";

import { useSocket } from "@/client/hooks/useSocket";
import {
  closeHelpModal,
  setCreateRoomModalOpen, setJoinRoomModalOpen
} from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import useBackgroundPreload from "@/client/hooks/useBackgroundPreload";
import useIsMobile from "@/client/hooks/useIsMobile";
import { signIn, useSession } from "next-auth/react";
import {
  LogIn, Play,
} from "lucide-react";
import { useEffect } from "react";
import RecentPublishedDecksPanel from "./components/RecentPublishedDecksPanel";
import RecentDecksPanel from "./components/RecentDecksPanel";
import ArenaShell from "./components/arena/ArenaShell";

const primaryButtonClass = [
  "inline-flex min-w-[195px] items-center justify-center gap-2 border border-[#8ecaff]",
  "cursor-pointer bg-gradient-to-tr from-slate-950 to-slate-800 text-slate-100 px-[25px] py-[14px]",
  "font-serif lg:text-[27px] font-semibold text-[#f7fbff]",
  "hover:shadow-[0_0_0_2px_rgba(79,169,255,.35),0_0_28px_rgba(79,169,255,.62)]",
  "transition-all",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
].join(" ");

const homeContainerClass = [
  "mx-auto flex min-h-0 flex-col overflow-hidden",
  "h-[calc(100dvh-64px)] w-[calc(100%-32px)] gap-3 py-3",
  "sm:h-[calc(100dvh-76px)] sm:w-[min(1380px,calc(100%-64px))]",
  "sm:gap-[14px] sm:pb-8 sm:pt-[40px]",
  "[@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:pt-2.5",
  "[@media(max-height:600px)]:gap-1 [@media(max-height:600px)]:py-1.5",
].join(" ");

export default function NewHome() {
  const dispatch = useAppDispatch();
  const { rooms } = useSocket();
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  useBackgroundPreload();

  useEffect(() => { dispatch(closeHelpModal()); }, [dispatch]);
  const roomList = Object.values(rooms);

  return <ArenaShell>
    <div className={homeContainerClass}>
      <section className="hidden w-full sm:flex flex-col text-shadow-[0_2px_5px_#000] md:flex-row md:items-end">
        <div className="w-full md:w-1/2">
          <h1 className="m-0 font-serif text-[27px] leading-[.98] tracking-[-.04em] sm:my-2.5 sm:text-[clamp(36px,5vw,66px)]">Legions Battleground</h1>
          <span className="hidden text-base leading-[1.55] sm:block">
            Build decks, practice in sandbox mode, and challenge other players.
          </span>
        </div>
      </section>
      <div className="flex min-h-0 w-full shrink flex-col py-2 md:flex-row">
        <section className="min-h-0 grow shrink md:h-full w-full md:w-3/5 px-2">
          <div className="flex flex-col items-start h-full">
            <div className="flex justify-center items-center">
              {(!isMobile || !session ) && <>
                <button className={primaryButtonClass} type="button" onClick={() => session ? dispatch(setCreateRoomModalOpen(true)) : signIn()}>{session ? "Play" : "Enter The Battleground"} {session ? <Play size={26} /> : <LogIn size={26} />}</button>
              </>}
            </div>
            <div className="pt-2 shrink min-h-0 overflow-y-scroll my-2 w-full border-b border-white/20 bg-[rgba(4,9,13,.66)] shadow-[0_15px_40px_rgba(0,0,0,.32)] backdrop-blur-[8px]">
              <header className="flex items-center justify-between border-b border-white/15 p-3 sm:px-[17px] sm:py-[13px]">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[.16em] text-[#eef4fa]">Active Games</p>
                </div>
                <span className="text-xs text-[#eef4fa]"><i className="mb-px mr-[7px] inline-block size-[7px] rounded-full bg-[#4fa9ff] shadow-[0_0_8px_#4fa9ff]" />{roomList.length} active {roomList.length === 1 ? "room" : "rooms"}</span>
              </header>
              {roomList.length ? <div>
                {roomList.map((room) => 
                  <div className="grid items-center gap-2 border-b border-white/15 px-3 last:border-0 hover:bg-blue-400/10 grid-cols-[1fr_120px_75px_70px] pl-[18px] pr-3" key={room.id}>
                    <strong className="text-sm text-[#e9f0f6]">{room.id}</strong>
                    <span className="text-[13px] text-[#e9f0f6] block">{room.hostName || "Player"}</span>
                    <span className="text-[13px] text-[#e9f0f6] block">{room.playerCount} players</span>
                    {isMobile ? <span className="text-[11px] text-[#87bce9]">N/A on mobile</span> : <button className="cursor-pointer border border-[#4fa9ff] bg-[#246fb8] px-2 py-1.5 font-serif text-sm text-[#eaf5ff] shadow-[0_0_10px_rgba(79,169,255,.25)] transition-colors hover:bg-[#338de0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" type="button" onClick={() => session ? dispatch(setJoinRoomModalOpen(room.id)) : signIn()}>Join</button>}
                  </div>
                )}
              </div> : <div className="p-[29px_18px] text-sm text-[#e1e8ee]">No active games right now. Create one when you are ready to play.</div>}
            </div>
            {session && <RecentDecksPanel />}
          </div>
        </section>
        <section className="flex w-full mt-2 md:mt-0 min-h-[88px] flex-none justify-center overflow-hidden px-2 sm:min-h-[130px] md:w-2/5">
          <RecentPublishedDecksPanel />
        </section>
      </div>
      {/* {session && (
        <section className="flex min-h-[150px] max-h-[260px] shrink-0 overflow-hidden px-2">
          <RecentDecksPanel />
        </section>
      )} */}

    </div>
  </ArenaShell>;
}
