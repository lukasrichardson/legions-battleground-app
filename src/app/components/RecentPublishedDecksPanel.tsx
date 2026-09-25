import { fetchRecentPublishedDecks } from "@/client/utils/api.utils";
import { Button } from "@/client/ui/button";
import { legionColours } from "@/client/constants/colours.constants";
import { LEGIONS } from "@/client/constants/legions.constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { CARD_TYPE } from "@/shared/enums/CardType";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const getDeckWarlord = (deck: PublishedDeck) => (
  deck.cards_in_deck?.find(
    (card) => card.card_type?.names?.[0] === CARD_TYPE.WARLORD,
  )
);

const getDeckCoverImage = (deck: PublishedDeck): string | null => {
  const warlord = getDeckWarlord(deck);
  return warlord?.featured_image ?? deck.cards_in_deck?.[0]?.featured_image ?? null;
};

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

const formatPublishedDate = (publishedDate: Date) => (
  new Date(publishedDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
);

// Card data can contain HTML entities. Decode those for display while React
// continues to escape the resulting text safely when it renders JSX.
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

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700/50 text-xl" aria-hidden="true">
        ♜
      </div>
      <p className="text-base text-gray-300">No published decks yet</p>
      <p className="mt-1 text-sm text-gray-500">Community decklists will appear here.</p>
    </div>
  );
}

export default function RecentPublishedDecksPanel() {
  const router = useRouter();
  const [decks, setDecks] = useState<PublishedDeck[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let isActive = true;

    fetchRecentPublishedDecks()
      .then((recentDecks) => {
        if (!isActive) return;
        setDecks(recentDecks);
        setStatus("ready");
      })
      .catch(() => {
        if (isActive) setStatus("error");
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-white/20 bg-white/10 text-white">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-lg">Recently Published Decks</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="px-0 text-blue-300 hover:text-blue-200"
          onClick={() => router.push("/decks/browse")}
        >
          Browse all
        </Button>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
        {status === "loading" && (
          <div className="space-y-2 pt-2" aria-label="Loading recent decks">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className="h-16 w-12 animate-pulse rounded-md bg-white/10 lg:h-[4.5rem] lg:w-[3.375rem]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-gray-400">Recent decks could not be loaded.</p>
          </div>
        )}

        {status === "ready" && decks.length === 0 && <EmptyState />}

        {status === "ready" && decks.length > 0 && (
          <ul className="divide-y divide-white/10" aria-label="Five most recently published decks">
            {decks.slice(0, 5).map((deck) => {
              const warlord = getDeckWarlord(deck);
              const coverImage = getDeckCoverImage(deck);
              const deckId = deck._id?.toString() || deck.id;

              return (
                <li key={deckId}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={() => deckId && router.push(`/decks/browse/${deckId}`)}
                    aria-label={`Open published deck ${deck.name}`}
                  >
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt=""
                        width={48}
                        height={64}
                        className="h-16 w-12 shrink-0 rounded-md object-cover lg:h-[4.5rem] lg:w-[3.375rem]"
                      />
                    ) : (
                      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-700/60 text-gray-400 lg:h-[4.5rem] lg:w-[3.375rem]" aria-hidden="true">
                        ♜
                      </div>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="max-w-[60%] shrink-0 truncate text-sm font-bold text-white">{deck.name}</span>
                        <span className="min-w-0 truncate text-xs text-gray-400">by {deck.author || "Unknown Author"}</span>
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-2">
                        <span
                          className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs font-medium capitalize"
                          style={getLegionLabelStyle(deck.legion)}
                        >
                          {deck.legion}
                        </span>
                        {warlord?.title && (
                          <span className="truncate text-xs text-gray-300">
                            {formatWarlordName(warlord.title)}
                          </span>
                        )}
                      </span>
                      {deck.published_date && (
                        <span className="mt-1 block text-sm text-gray-300">
                          {formatPublishedDate(deck.published_date)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
