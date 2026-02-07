"use client";
import useWindowSize from "@/client/hooks/useWindowSize";
import { useMemo } from "react";

const SCALE_WIDTH = 1200;
const SCALE_HEIGHT = 815;
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const size = useWindowSize();
  const scaleX = useMemo(() => (size.width ? size.width / SCALE_WIDTH : 1), [size.width]);
  const scaleY = useMemo(() => (size.height ? size.height / SCALE_HEIGHT : 1), [size.height]);
  const smallestScale = Math.min(scaleX, scaleY);
  const styles = useMemo(
    () => ({
      transform: `scale(${smallestScale}, ${smallestScale})`,
      width: SCALE_WIDTH,
      height: SCALE_HEIGHT,
      transformOrigin: "left top",
    }),
    [smallestScale],
  );
  return (
    <body style={styles} className="bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900">
      <div className={"flex flex-col justify-center items-center relative h-full w-full overflow-hidden"}>
      {children}
      </div>
    </body>
  )
}