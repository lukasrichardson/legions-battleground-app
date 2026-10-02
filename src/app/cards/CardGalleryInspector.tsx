import CardImage from "@/app/components/Card/CardImage";
import AppIcon from "@/app/components/AppIcon";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import BanlistItem, { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const statusLabel: Partial<Record<BanlistStatus, string>> = {
  [BanlistStatus.SUSPENDED]: "Suspended",
  [BanlistStatus.RESTRICTED]: "Restricted",
  [BanlistStatus.LIMITED]: "Limited",
};

const statusClass: Partial<Record<BanlistStatus, string>> = {
  [BanlistStatus.SUSPENDED]: "border-red-300/30 bg-red-400/10 text-red-200",
  [BanlistStatus.RESTRICTED]: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  [BanlistStatus.LIMITED]: "border-violet-300/30 bg-violet-400/10 text-violet-100",
};

export default function CardGalleryInspector({
  card,
  banlistItem,
  onClose,
  compact = false,
  isPinned = false,
  onClearPinned,
}: {
  card: CardDocument | null;
  banlistItem: BanlistItem | null;
  onClose?: () => void;
  compact?: boolean;
  isPinned?: boolean;
  onClearPinned?: () => void;
}) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const closeImageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!imageExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setImageExpanded(false);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    closeImageButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [imageExpanded]);

  useEffect(() => {
    setImageExpanded(false);
  }, [card?._id]);

  if (!card) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
        <p className="font-medium text-slate-200">Hover or Select a card to inspect it</p>
      </div>
    );
  }

  const type = card.card_type.names[0];
  const subtype = card.card_subtype.names[0];
  const legion = card.legion.names[0];
  const rarity = card.rarity.names[0];
  const set = card.set.names[0];
  const variant = card.variant.names[0];
  const keywords = card.keywords.names;
  const status = banlistItem?.status;

  return (
    <section aria-label={`${decodeHTMLEntities(card.title)} details`} className="relative flex h-full min-h-0 flex-col text-slate-100">
      {isPinned && onClearPinned && (
        <button type="button" aria-label="Clear pinned card" onClick={onClearPinned} className="absolute left-2 top-2 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full border border-white bg-cyan-300/70 px-2 py-1 text-xs font-medium text-black hover:text-cyan-50 shadow-sm backdrop-blur transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          Pinned <AppIcon name="close" size={12} />
        </button>
      )}
      {onClose && (
        <button type="button" aria-label="Close card details" onClick={onClose} className="sticky right-3 top-4 ml-auto z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <AppIcon name="close" size={18} />
        </button>
      )}
      <div className={compact ? "mx-auto w-full max-w-[80%] sm:max-w-[60%] md:max-w-[40%]" : "mx-auto w-full max-w-72"}>
        <button
          type="button"
          onClick={() => setImageExpanded(true)}
          aria-label={`View ${decodeHTMLEntities(card.title)} image full screen`}
          className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-xl transition hover:border-cyan-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <CardImage src={card.featured_image} alt={decodeHTMLEntities(card.title)} className="object-contain" />
        </button>
      </div>
      <div className="min-h-0 flex-1 pt-2 flex flex-col">
        <h2 className="pr-10 text-lg font-semibold leading-6 text-white">{decodeHTMLEntities(card.title)}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {[type, subtype, legion, rarity].filter(Boolean).map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{item}</span>)}
          {status && statusLabel[status] && <span className={`rounded-full border px-2 py-1 ${statusClass[status]}`}>{statusLabel[status]}</span>}
        </div>
        {(set || card.card_code || card.card_release || variant || card.attack > 0) && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-y border-white/10 py-2 text-xs">
            {set && <Meta label="Set" value={set} />}
            {card.card_code && <Meta label="Code" value={card.card_code} />}
            {card.card_release && <Meta label="Release" value={card.card_release} />}
            {variant && <Meta label="Variant" value={variant} />}
            {card.attack > 0 && <Meta label="Attack" value={String(card.attack)} />}
          </dl>
        )}
        {keywords.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{keywords.map((keyword) => <span key={keyword} className="rounded-md bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">{keyword}</span>)}</div>}
        {card.text && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300 overflow-y-scroll">{decodeHTMLEntities(card.text)}</p>}
      </div>
      {imageExpanded && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${decodeHTMLEntities(card.title)} full screen image`}
          onClick={(event) => {
            event.stopPropagation();
            setImageExpanded(false);
          }}
        >
          <div className="relative h-full w-full max-w-5xl cursor-default" onClick={(event) => event.stopPropagation()}>
            <button
              ref={closeImageButtonRef}
              type="button"
              onClick={() => setImageExpanded(false)}
              aria-label="Close full screen image"
              className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-lg transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <AppIcon name="close" size={24} />
            </button>
            <div className="relative h-full w-full">
              <CardImage src={card.featured_image} alt={decodeHTMLEntities(card.title)} className="object-contain" priority />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-slate-200">{value}</dd></div>;
}
