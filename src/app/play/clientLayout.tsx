"use client";
import useWindowSize from "@/client/hooks/useWindowSize";
import { useMemo, type CSSProperties } from "react";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { openLeaveGameModal } from "@/client/redux/modalsSlice";
import { resetState } from "@/client/redux/gameStateSlice";
import { MatchStatus } from "@/shared/enums/Match";
import { socket } from "@/client/socket";
import { useRouter } from "next/navigation";

const SCALE_WIDTH = 1200;
const SCALE_HEIGHT = 815;
type WorkspaceStyle = CSSProperties & { "--game-sidebar-width": string };
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const size = useWindowSize();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { sandboxMode, matchStatus } = useAppSelector((state) => state.gameState);
  const backToLobby = () => {
    if (!sandboxMode && matchStatus !== MatchStatus.Completed) {
      dispatch(openLeaveGameModal("/"));
      return;
    }
    if (!sandboxMode) socket.emit("leaveRegularRoom");
    socket.disconnect();
    dispatch(resetState());
    router.push("/");
  };
  const isMobilePortrait = Boolean(
    size.width
    && size.height
    && size.width <= 767
    && size.height > size.width,
  );
  const scaleX = useMemo(() => (size.width ? size.width / SCALE_WIDTH : 1), [size.width]);
  const scaleY = useMemo(() => (size.height ? size.height / SCALE_HEIGHT : 1), [size.height]);
  const smallestScale = Math.min(scaleX, scaleY);
  const compact = Boolean(size.width && size.width <= 1100);
  const styles = useMemo<WorkspaceStyle>(
    () => ({
      transform: `scale(${smallestScale}, ${smallestScale})`,
      // Keep cards proportional, but let the canvas grow along the axis that
      // isn't limiting their scale. A fixed 1200px canvas left wide-screen gutters.
      width: size.width ? size.width / smallestScale : SCALE_WIDTH,
      height: size.height ? size.height / smallestScale : SCALE_HEIGHT,
      "--game-sidebar-width": `${Math.min(320, Math.max(248, (size.width ? size.width / smallestScale : SCALE_WIDTH) * 0.18))}px`,
      transformOrigin: "center center",
    }),
    [smallestScale, size.width, size.height],
  );
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#050a0e] bg-[radial-gradient(circle_at_70%_20%,rgba(27,90,145,.24),transparent_34%),linear-gradient(135deg,#050a0e,#10243a_50%,#050a0e)]">
      <div className="absolute flex items-center justify-center overflow-hidden" style={{ top: "env(safe-area-inset-top)", right: "env(safe-area-inset-right)", bottom: "env(safe-area-inset-bottom)", left: "env(safe-area-inset-left)" }}>
        <div ref={(node) => { node?.toggleAttribute("inert", isMobilePortrait); }} aria-hidden={isMobilePortrait || undefined} style={compact ? { width: "100%", height: "100%" } : styles} data-compact-game={compact || undefined} data-wide-game={!compact || undefined} className="game-workspace relative shrink-0 overflow-hidden border border-sky-200/10 shadow-[0_0_60px_rgba(0,0,0,.55)]">{children}</div>
      </div>
      {isMobilePortrait && (
        <section
          className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950 p-8 text-center text-slate-100"
          aria-label="Landscape required to play"
          aria-live="polite"
        >
          <div>
            <div className="mx-auto mb-4 grid size-12 place-items-center border border-sky-200/35 bg-sky-300/10 text-2xl text-sky-200" aria-hidden="true">↻</div>
            <h1 className="font-serif text-xl">Rotate your device</h1>
            <p className="mt-2 text-sm text-slate-400">Legions Battleground is played in landscape.</p>
            <button type="button" onClick={backToLobby} className="mt-6 min-h-11 border border-sky-200/35 bg-slate-900 px-5 py-3 text-sm font-semibold text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Back to lobby</button>
          </div>
        </section>
      )}
    </div>
  )
}
