import CardImage from "@/app/components/Card/CardImage";
import AppIcon from "@/app/components/AppIcon";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import CardStatusBadge from "@/app/components/Card/CardStatusBadge";

export type InspectableCard = HydratedDeckCard &
  Partial<
    Pick<
      CardDocument,
      | "card_subtype"
      | "rarity"
      | "set"
      | "variant"
      | "keywords"
      | "card_release"
      | "attack"
    >
  >;

export default function CardGalleryInspector({
  card,
  banlistItem,
  onClose,
  compact = false,
  isPinned = false,
  onClearPinned,
  withActionFooter = false,
}: {
  card: InspectableCard | null;
  banlistItem: BanlistItem | null;
  onClose?: () => void;
  compact?: boolean;
  isPinned?: boolean;
  onClearPinned?: () => void;
  withActionFooter?: boolean;
}) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const closeImageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!imageExpanded) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const ownsScrollLock = previousOverflow !== "hidden";
    if (ownsScrollLock) document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeImageButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setImageExpanded(false);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    closeImageButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (ownsScrollLock) document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [imageExpanded]);

  useEffect(() => {
    setImageExpanded(false);
  }, [card?._id]);

  if (!card) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-[2px] border border-white/10 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
        <span className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
          Card inspector
        </span>
        <p className="font-medium text-slate-100">
          Preview cards as you browse
        </p>
        <p className="mt-2 max-w-52 text-xs leading-5 text-slate-400">
          Tap or select a card to inspect its details.
        </p>
      </div>
    );
  }

  const type = card.card_type.names[0];
  const subtype = card.card_subtype?.names[0];
  const legion = card.legion.names[0];
  const rarity = card.rarity?.names[0];
  const set = card.set?.names[0];
  const variant = card.variant?.names[0];
  const keywords = card.keywords?.names ?? [];

  return (
    <section
      aria-label={`${decodeHTMLEntities(card.title)} details`}
      className="relative flex h-full min-h-0 flex-col text-slate-100"
    >
      {isPinned && onClearPinned && (
        <button
          type="button"
          aria-label="Clear pinned card"
          onClick={onClearPinned}
          className="absolute left-2 top-2 z-10 inline-flex cursor-pointer items-center gap-1 border border-sky-200/45 bg-[#246fb8] px-2 py-1 text-xs font-medium text-white shadow-[0_0_12px_rgba(79,169,255,.2)] backdrop-blur transition hover:bg-[#338de0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Pinned <AppIcon name="close" size={12} />
        </button>
      )}
      {onClose && (
        <button
          type="button"
          aria-label="Close card details"
          onClick={onClose}
          className="touch-feedback sticky right-3 top-2 ml-auto z-10 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-sky-200/30 bg-slate-950/80 text-slate-300 transition hover:border-sky-200/60 hover:bg-blue-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <AppIcon name="close" size={18} />
        </button>
      )}
      <div
        style={compact ? { "--inspector-image-limit": `calc(max(60px, 85dvh - ${withActionFooter ? "12rem" : "8rem"}) * .75)` } as CSSProperties : undefined}
        className={
          compact
            ? "mx-auto w-full max-w-[min(18rem,var(--inspector-image-limit))] sm:max-w-[min(60%,var(--inspector-image-limit))] md:max-w-[min(40%,var(--inspector-image-limit))]"
            : "mx-auto w-full max-w-72"
        }
      >
        <button
          type="button"
          onClick={() => setImageExpanded(true)}
          aria-label={`View ${decodeHTMLEntities(card.title)} image full screen`}
          className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-xl transition hover:border-blue-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <CardImage
            src={card.featured_image}
            alt={decodeHTMLEntities(card.title)}
            className="object-contain"
          />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
        <h2 className="pr-10 text-lg font-semibold leading-6 text-white">
          {decodeHTMLEntities(card.title)}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {[type, subtype, legion, rarity].filter(Boolean).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200"
            >
              {item}
            </span>
          ))}
          <CardStatusBadge item={banlistItem} />
        </div>
        {(set ||
          card.card_code ||
          card.card_release ||
          variant ||
          (card.attack ?? 0) > 0) && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-y border-white/10 py-2 text-xs">
            {set && <Meta label="Set" value={set} />}
            {card.card_code && <Meta label="Code" value={card.card_code} />}
            {card.card_release && (
              <Meta label="Release" value={card.card_release} />
            )}
            {variant && <Meta label="Variant" value={variant} />}
            {(card.attack ?? 0) > 0 && (
              <Meta label="Attack" value={String(card.attack)} />
            )}
          </dl>
        )}
        {keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-md bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
        {card.text && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
            {decodeHTMLEntities(card.text)}
          </p>
        )}
      </div>
      {imageExpanded &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-[radial-gradient(circle_at_top,rgba(52,136,205,.2),transparent_42%),rgba(1,5,10,.88)] p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${decodeHTMLEntities(card.title)} full screen image`}
            onClick={(event) => {
              event.stopPropagation();
              setImageExpanded(false);
            }}
          >
            <div
              className="relative h-full w-full max-w-5xl cursor-default"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                ref={closeImageButtonRef}
                type="button"
                onClick={() => setImageExpanded(false)}
                aria-label="Close full screen image"
                className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center border border-sky-200/40 bg-slate-950/85 text-white shadow-[0_0_16px_rgba(79,169,255,.2)] transition hover:border-sky-200/70 hover:bg-blue-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <AppIcon name="close" size={24} />
              </button>
              <div className="relative h-full w-full">
                <CardImage
                  src={card.featured_image}
                  alt={decodeHTMLEntities(card.title)}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-200">{value}</dd>
    </div>
  );
}
