import Breadcrumbs from "./Breadcrumbs";
import { usePathname } from "next/navigation";

const breadcrumbLabels: Record<string, string> = {
  cards: "Card Gallery",
  decks: "Decks",
  browse: "Published Decks",
};

export default function FullPage({ children, showBreadcrumbs }: { children: React.ReactNode, showBreadcrumbs?: boolean }) {
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
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900">
      {showBreadcrumbs && (
        <div className="relative z-10 shrink-0 px-3 pt-3 sm:px-4 sm:pt-4">
          <Breadcrumbs breadcrumbs={[{name: "Home", path: "/"}, ...breadcrumbs]} />
        </div>
      )}
      <p className="text-white"><a className="fixed right-2 top-2" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer">Donate☕</a></p>
      <div className="flex min-h-0 flex-1 flex-col overflow-scroll px-4 pb-6 pt-2">
        {children}
      </div>
    </div>
  );
}
