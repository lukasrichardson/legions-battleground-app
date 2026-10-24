import Breadcrumbs from "./Breadcrumbs";
import { usePathname } from "next/navigation";
import ArenaShell from "./arena/ArenaShell";
import { useUiVariant } from "./arena/uiVariant";

const breadcrumbLabels: Record<string, string> = {
  cards: "Card Gallery",
  decks: "Decks",
  browse: "Published Decks",
};

export default function FullPage({
  children,
  showBreadcrumbs,
  topRightContent,
  scrollOnShortLandscape = false,
  scrollOnMobile = false,
}: {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  topRightContent?: React.ReactNode;
  scrollOnShortLandscape?: boolean;
  scrollOnMobile?: boolean;
}) {
  const variant = useUiVariant();
  const pathName = usePathname();
  const breadcrumbs = pathName.split("/").filter(Boolean).map((segment, index, arr) => {
    const name = breadcrumbLabels[segment]
      ?? (arr[index - 1] === "browse"
        ? "Deck Details"
        : arr[index - 1] === "decks"
          ? "Deck Builder"
          : segment.charAt(0).toUpperCase() + segment.slice(1));
    const path = "/" + arr.slice(0, index + 1).join("/");
    return { name, path };
  });
  const pageBody = <>
    {showBreadcrumbs && (
      <div className="relative z-10 shrink-0 px-3 pt-2 sm:px-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
    )}
    <div className={variant === "arena" ? "hidden" : "fixed right-2 top-2 z-20 flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-end gap-2 text-white sm:right-4 sm:top-4"}>
      {topRightContent}
      <a className="rounded-md px-2 py-1 text-sm transition-colors hover:bg-white/10" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer">Donate☕</a>
    </div>
    <div className={(variant === "arena" ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-2" : "flex min-h-0 flex-1 flex-col px-4 pb-6 pt-2") + (scrollOnShortLandscape ? " short-landscape-flow" : "") + (scrollOnMobile ? " mobile-page-flow" : "")}>{children}</div>
  </>;

  if (variant === "arena") return <ArenaShell scrollOnShortLandscape={scrollOnShortLandscape} scrollOnMobile={scrollOnMobile}><div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${scrollOnShortLandscape ? "short-landscape-flow" : ""} ${scrollOnMobile ? "mobile-page-flow" : ""}`}>{pageBody}</div></ArenaShell>;

  return (
    <div className={`flex h-dvh w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900 ${scrollOnShortLandscape ? "short-landscape-scroll" : ""} ${scrollOnMobile ? "mobile-page-scroll" : ""}`}>
      {pageBody}
    </div>
  );
}
