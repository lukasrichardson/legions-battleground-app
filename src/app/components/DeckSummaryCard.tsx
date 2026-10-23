import CardImage from "@/app/components/Card/CardImage";
import { DeckListItem } from "@/shared/interfaces/DeckListItem";
import { ReactNode } from "react";

type DeckSummaryCardProps = {
  deck: DeckListItem;
  onOpen: () => void;
  openLabel: string;
  detail?: ReactNode;
  action?: ReactNode;
};

export default function DeckSummaryCard({
  deck,
  onOpen,
  openLabel,
  detail,
  action,
}: DeckSummaryCardProps) {
  const featured = deck.coverCard?.title || "No featured card";

  return (
    <article className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={openLabel}
        className={`touch-feedback flex min-h-[var(--touch-target-size)] w-full gap-3 rounded-sm border border-white/15 bg-slate-950/35 p-3 text-left hover:bg-blue-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${action ? "pr-14" : ""}`}
      >
        <span className="relative block w-20 shrink-0 self-start overflow-hidden rounded border border-white/10">
          <span className="block aspect-[3/4]">
            {deck.coverCard ? (
              <CardImage
                src={deck.coverCard.featured_image}
                alt={featured}
                loading="lazy"
                priority={false}
                className="object-contain"
              />
            ) : (
              <span className="grid h-full place-items-center text-slate-500">
                ♜
              </span>
            )}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-base font-semibold text-white">
            {deck.name}
          </span>
          <span className="mt-1 block break-words text-sm text-sky-100">
            {deck.legion}
          </span>
          {detail}
          <span className="mt-1 block break-words text-xs text-slate-400">
            {featured}
          </span>
          <span className="mt-1 block text-xs text-slate-300">
            {deck.mainDeckSize} main · {deck.sideDeckSize} side
          </span>
        </span>
      </button>
      {action}
    </article>
  );
}
