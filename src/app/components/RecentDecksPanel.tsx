"use client";

import { fetchRecentDecks } from "@/client/utils/api.utils";
import { legionColours } from "@/client/constants/colours.constants";
import { LEGIONS } from "@/client/constants/legions.constants";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { RecentDeckListItem } from "@/shared/interfaces/DeckListItem";
import { FolderOpen } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type WheelEvent, useEffect, useState } from "react";
import LoadingState from "./LoadingState";

const getLegionLabelStyle = (legion: string) => {
  const legionName = Object.values(LEGIONS).find(
    (knownLegion) => knownLegion.toLowerCase() === legion.toLowerCase(),
  );

  if (!legionName) return undefined;

  return {
    backgroundColor: legionColours[legionName],
    color: [LEGIONS.ANGELS, LEGIONS.TITANS].includes(legionName) ? "black" : "white",
  };
};

const relativeEditedTime = (value: Date | string) => {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Edited ${days}d ago`;
};

const formatWarlordName = (title: string) => (
  title
    .replace(/&(?:amp|#38);/g, "&")
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&(?:lt|#60);/g, "<")
    .replace(/&(?:gt|#62);/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number.parseInt(value, 10)))
);

function DeckImage({ deck }: { deck: RecentDeckListItem }) {
  if (deck.coverCard?.featured_image) {
    return (
      <Image
        src={deck.coverCard.featured_image}
        alt=""
        width={48}
        height={64}
        className="h-16 w-12 shrink-0 rounded-md object-cover lg:h-[4.5rem] lg:w-[3.375rem]"
      />
    );
  }

  return (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-700/60 text-gray-400 lg:h-[4.5rem] lg:w-[3.375rem]" aria-hidden="true">
      <FolderOpen size={20} />
    </div>
  );
}

export default function RecentDecksPanel() {
  const router = useRouter();
  const [decks, setDecks] = useState<RecentDeckListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const handleHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (
      !window.matchMedia("(min-width: 768px)").matches
      || event.deltaX !== 0
      || event.deltaY === 0
    ) return;

    const panel = event.currentTarget;
    if (panel.scrollWidth <= panel.clientWidth) return;

    event.preventDefault();
    panel.scrollLeft += event.deltaY;
  };

  useEffect(() => {
    let active = true;
    fetchRecentDecks()
      .then((recentDecks) => {
        if (!active) return;
        setDecks(recentDecks);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => { active = false; };
  }, []);

  return (
    <Card className="flex w-auto max-w-full mx-auto min-w-0 flex-col overflow-hidden border-white/20 bg-white/10 text-white">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle id="recent-decks-title" className="text-lg">Your Recent Decks</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="px-0 text-blue-300 hover:text-blue-200"
          onClick={() => router.push("/decks")}
        >
          View all decks
        </Button>
      </CardHeader>

      {status === "loading" && (
        <CardContent className="p-4 pt-0">
          <LoadingState label="Loading recent decks…" className="h-full border-0" />
        </CardContent>
      )}

      {status === "ready" && decks.length === 0 && (
        <CardContent className="p-4 pt-0">
          <button
            type="button"
            onClick={() => router.push("/decks")}
            className="flex h-full w-full cursor-pointer items-center justify-center border-0 bg-transparent px-4 py-6 text-center text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Create or import a deck from Toolbox to get started
          </button>
        </CardContent>
      )}

      {status === "ready" && decks.length > 0 && (
        <CardContent
          className="overflow-y-auto p-4 pt-0 md:overflow-x-auto md:overflow-y-hidden"
          onWheel={handleHorizontalWheel}
        >
          <ul className="divide-y divide-white/10 md:flex md:divide-x md:divide-y-0 md:" aria-label="Three most recently edited decks">
            {decks.map((deck) => {
              const deckId = deck._id.toString();
              return (
                <li key={deckId}>
                  <button
                    type="button"
                    onClick={() => router.push(`/decks/${deckId}`)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label={`Edit deck ${deck.name}`}
                  >
                    <DeckImage deck={deck} />
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{deck.name}</span>
                          <span className="shrink-0 text-xs text-white">Main: {deck.mainDeckSize}</span>
                          <span className="shrink-0 text-xs text-white">Side: {deck.sideDeckSize}</span>
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-2">
                          <span
                            className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs font-medium capitalize"
                            style={getLegionLabelStyle(deck.legion)}
                          >
                            {deck.legion}
                          </span>
                          {deck.coverCard?.title && (
                            <span className="truncate text-xs text-gray-300">
                              {formatWarlordName(deck.coverCard.title)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-gray-300">{relativeEditedTime(deck.updated_at)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
