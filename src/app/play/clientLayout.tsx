"use client";
import useWindowSize from "@/client/hooks/useWindowSize";
import { useMemo } from "react";

const SCALE_WIDTH = 1200;
const SCALE_HEIGHT = 815;
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const size = useWindowSize();
  const isMobilePortrait = Boolean(
    size.width
    && size.height
    && size.width <= 767
    && size.height > size.width,
  );
  const scaleX = useMemo(() => (size.width ? size.width / SCALE_WIDTH : 1), [size.width]);
  const scaleY = useMemo(() => (size.height ? size.height / SCALE_HEIGHT : 1), [size.height]);
  const smallestScale = Math.min(scaleX, scaleY);
  const styles = useMemo(
    () => ({
      transform: `scale(${smallestScale}, ${smallestScale})`,
      width: SCALE_WIDTH,
      height: SCALE_HEIGHT,
      transformOrigin: "center center",
    }),
    [smallestScale],
  );
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#050a0e] bg-[radial-gradient(circle_at_70%_20%,rgba(27,90,145,.24),transparent_34%),linear-gradient(135deg,#050a0e,#10243a_50%,#050a0e)]">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div style={styles} className="relative shrink-0 overflow-hidden border border-sky-200/10 shadow-[0_0_60px_rgba(0,0,0,.55)]">{children}</div>
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
          </div>
        </section>
      )}
    </div>
  )
}
