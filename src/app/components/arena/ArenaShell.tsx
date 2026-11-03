"use client";

import ArenaNavigation from "./ArenaNavigation";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type UIEvent } from "react";

const mobileNavigationQuery = "(max-width: 1023px), (max-width: 1100px) and (max-height: 600px)";

export default function ArenaShell({ children, scrollOnShortLandscape = false, scrollOnShortViewport = false, scrollOnMobile = false }: { children: React.ReactNode; scrollOnShortLandscape?: boolean; scrollOnShortViewport?: boolean; scrollOnMobile?: boolean }) {
  const pathname = usePathname();
  const [navigationHidden, setNavigationHidden] = useState(false);
  const scrollPositions = useRef(new WeakMap<Element, { top: number; travel: number; height: number; contentHeight: number }>());
  const scrollResizeObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const viewport = window.matchMedia(mobileNavigationQuery);
    const observer = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        scrollPositions.current.set(target, { top: target.scrollTop, travel: 0, height: target.clientHeight, contentHeight: target.scrollHeight });
      }
    });
    scrollResizeObserver.current = observer;
    const reset = () => {
      setNavigationHidden(false);
      scrollPositions.current = new WeakMap();
      observer.disconnect();
    };
    reset();
    viewport.addEventListener("change", reset);
    return () => {
      viewport.removeEventListener("change", reset);
      observer.disconnect();
      scrollResizeObserver.current = null;
    };
  }, [pathname]);

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    if (!window.matchMedia(mobileNavigationQuery).matches) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    // Scroll events from horizontal card strips must not collapse the navbar.
    if (target.scrollHeight <= target.clientHeight) return;
    const top = Math.max(0, Math.min(target.scrollTop, target.scrollHeight - target.clientHeight));
    const height = target.clientHeight;
    const contentHeight = target.scrollHeight;
    if (!scrollPositions.current.has(target)) scrollResizeObserver.current?.observe(target);
    const previous = scrollPositions.current.get(target) ?? { top: 0, travel: 0, height, contentHeight };
    // Reclaiming the header changes the scrollport. Its resulting scroll
    // adjustment is layout, not a reversal of the user's scroll direction.
    if (previous.height !== height || previous.contentHeight !== contentHeight) {
      scrollPositions.current.set(target, { top, travel: 0, height, contentHeight });
      return;
    }
    const delta = top - previous.top;
    const travel = Math.sign(delta) === Math.sign(previous.travel) ? previous.travel + delta : delta;
    scrollPositions.current.set(target, { top, travel, height, contentHeight });
    if (top <= 8 || travel <= -12) setNavigationHidden(false);
    else if (top > 64 && travel >= 24) setNavigationHidden(true);
  };

  return (
    <div data-navigation-hidden={navigationHidden} className="arena-shell relative flex h-dvh min-h-dvh flex-col overflow-hidden bg-[#050a0e] bg-[url('/chris-stenger-DTMhL0OpXjQ-unsplash.jpg')] bg-cover bg-center bg-fixed text-[#edf5ff]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(90deg,rgba(3,7,11,.88),rgba(3,7,11,.92)),linear-gradient(0deg,rgba(2,5,8,.9),transparent_90%)]"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="arena-navigation-slot relative z-20 shrink-0" onFocusCapture={() => setNavigationHidden(false)}>
          <ArenaNavigation />
        </div>
        <main onScrollCapture={handleScroll} className={`min-h-0 flex-1 overflow-hidden ${scrollOnShortLandscape ? "short-landscape-scroll" : ""} ${scrollOnShortViewport ? "short-viewport-scroll" : ""} ${scrollOnMobile ? "mobile-page-scroll" : ""}`}>{children}</main>
      </div>
    </div>
  );
}
