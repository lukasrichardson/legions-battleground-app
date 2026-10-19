"use client";

import ArenaNavigation from "./ArenaNavigation";

export default function ArenaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh min-h-dvh flex-col overflow-hidden bg-[#050a0e] bg-[url('/chris-stenger-DTMhL0OpXjQ-unsplash.jpg')] bg-cover bg-center bg-fixed text-[#edf5ff]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(90deg,rgba(3,7,11,.88),rgba(3,7,11,.92)),linear-gradient(0deg,rgba(2,5,8,.9),transparent_90%)]"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <ArenaNavigation />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
