"use client";

import { useSocket } from "@/client/hooks/useSocket";
import {
  closeHelpModal,
  setCreateRoomModalOpen, setJoinRoomModalOpen
} from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import useBackgroundPreload from "@/client/hooks/useBackgroundPreload";
import { signIn, useSession } from "next-auth/react";
import {
  Lock, LogIn, Play,
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
  "mx-auto flex h-full min-h-0 flex-col overflow-y-auto",
  "w-[calc(100%-24px)] gap-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]",
  "md:h-[calc(100dvh-76px)] sm:w-[min(1380px,calc(100%-64px))] md:overflow-hidden",
  "sm:gap-[14px] sm:pb-8 sm:pt-[40px]",
  "[@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:pt-2.5",
  "[@media(max-height:600px)]:gap-1 [@media(max-height:600px)]:py-1.5",
].join(" ");

export default function NewHome() {
  const dispatch = useAppDispatch();
  const { rooms } = useSocket();
  const { data: session } = useSession();
  useBackgroundPreload();

  useEffect(() => { dispatch(closeHelpModal()); }, [dispatch]);
  const roomList = Object.values(rooms);

  return <ArenaShell>
    <div className={homeContainerClass}>
      <section className="hidden w-full sm:flex flex-col text-shadow-[0_2px_5px_#000] md:flex-row md:items-end">
        <div className="w-full md:w-1/2">
          <h1 className="m-0 font-serif text-[27px] leading-[.98] tracking-[-.04em] sm:my-2.5 sm:text-[clamp(36px,5vw,66px)]">Legions Battleground</h1>
          <span className="hidden text-base leading-[1.55] sm:block">
            Play and practice LRAW online - <span className="text-green-500"><a href="https://legionstoolbox.com" target="_blank" rel="noopener noreferrer">Powered By <span className="!underline">LegionsToolbox.com</span></a></span>
          </span>
        </div>
      </section>
      <div className="flex min-h-0 w-full shrink-0 flex-col py-2 md:shrink md:flex-row">
        <section className="min-h-0 grow shrink md:h-full w-full md:w-3/5 px-0 sm:px-2">
          <div className="flex flex-col items-start md:h-full md:overflow-y-auto md:[&>*]:shrink-0">
            <div className="flex w-full justify-center items-center">
                <button className={`${primaryButtonClass} min-h-11 w-full max-w-md sm:w-auto`} type="button" onClick={() => session ? dispatch(setCreateRoomModalOpen(true)) : signIn()}>{session ? "Play" : "Enter The Battleground"} {session ? <Play size={26} /> : <LogIn size={26} />}</button>
            </div>
            <div className="pt-2 shrink min-h-0 my-3 w-full border-b border-white/20 bg-[rgba(4,9,13,.66)] shadow-[0_15px_40px_rgba(0,0,0,.32)] backdrop-blur-[8px] md:overflow-y-auto">
              <header className="flex items-center justify-between border-b border-white/15 p-2 sm:px-[17px] sm:py-[13px]">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[.16em] text-[#eef4fa]">Active Games</p>
                </div>
                <span className="text-xs text-[#eef4fa]"><i className="mb-px mr-[7px] inline-block size-[7px] rounded-full bg-[#4fa9ff] shadow-[0_0_8px_#4fa9ff]" />{roomList.length} active {roomList.length === 1 ? "room" : "rooms"}</span>
              </header>
              {roomList.length ? <div className="divide-y divide-white/15">
                {roomList.map((room) => 
                  <article className="grid min-w-0 gap-3 px-3 py-3 hover:bg-blue-400/10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={room.id}>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <strong className="min-w-0 truncate text-sm text-[#e9f0f6]" title={room.id}>{room.id}</strong>
                        {room.isLocked && <span className="inline-flex shrink-0 items-center gap-1 border border-amber-200/35 bg-amber-300/10 px-1.5 py-0.5 text-[11px] text-amber-100"><Lock size={12} aria-hidden="true" /> Locked</span>}
                        <span className="shrink-0 border border-sky-200/25 bg-sky-300/10 px-1.5 py-0.5 text-[11px] text-sky-100">{room.sandboxMode ? "Sandbox" : "Match"}</span>
                      </div>
                      <p className="m-0 truncate text-[13px] text-[#e9f0f6]" title={room.hostName || "Player"}>Hosted by {room.hostName || "Player"} · {room.playerCount} {room.playerCount === 1 ? "player" : "players"}</p>
                    </div>
                    <button className="min-h-11 w-full cursor-pointer border border-[#4fa9ff] bg-[#246fb8] px-4 py-2 font-serif text-sm text-[#eaf5ff] shadow-[0_0_10px_rgba(79,169,255,.25)] transition-colors hover:bg-[#338de0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto" type="button" onClick={() => session ? dispatch(setJoinRoomModalOpen(room.id)) : signIn()}>Join</button>
                  </article>
                )}
              </div> : <div className="space-y-3 p-4 text-sm text-[#e1e8ee]"><p className="m-0">No active games right now. Create one when you are ready to play.</p></div>}
            </div>
            {session && <RecentDecksPanel />}
          </div>
        </section>
        <section className="flex w-full mt-2 md:mt-0 min-h-[220px] flex-none justify-center px-0 sm:min-h-[130px] md:w-2/5 md:overflow-hidden md:px-2">
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
