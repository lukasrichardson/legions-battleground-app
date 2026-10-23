/** Shared title/count layout for recent personal and published deck cards. */
export default function DeckSummaryHeading({ name, mainCount, sideCount }: { name: string; mainCount: number; sideCount: number }) {
  return <span data-deck-summary-heading className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:flex-nowrap">
    <span className="min-w-0 basis-full truncate text-sm font-bold text-white sm:flex-1 sm:basis-auto">{name}</span>
    <span className="shrink-0 text-xs text-white">Main: {mainCount}</span>
    <span className="shrink-0 text-xs text-white">Side: {sideCount}</span>
  </span>;
}
