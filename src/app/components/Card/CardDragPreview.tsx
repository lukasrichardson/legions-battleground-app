import Image from "next/image";
import { createPortal } from "react-dom";
import { useDragLayer } from "react-dnd";
import backOfCard from "PUBLIC/back_of_card.jpg";

const CARD_WIDTH = 75;
const CARD_HEIGHT = 100;
const BORDER_WIDTH = 2;
const CURSOR_GAP = 12;

export default function CardDragPreview() {
  const { isDragging, item, position } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging() && ["card", "cardFromDeck", "cardFromSearch"].includes(String(monitor.getItemType())),
    item: monitor.getItem() as { previewImage?: string } | null,
    position: monitor.getClientOffset(),
  }));

  if (!isDragging || !position) return null;
  const width = CARD_WIDTH + BORDER_WIDTH;
  const height = CARD_HEIGHT + BORDER_WIDTH;
  const left = Math.max(0, Math.min(position.x + CURSOR_GAP, window.innerWidth - width));
  const top = position.y + CURSOR_GAP + height <= window.innerHeight
    ? position.y + CURSOR_GAP
    : Math.max(0, position.y - CURSOR_GAP - height);
  return createPortal(
    <div data-testid="card-drag-preview" aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[10000] overflow-hidden rounded border border-sky-200/50 shadow-xl" style={{ transform: `translate(${left}px, ${top}px)` }}>
      <Image src={item?.previewImage || backOfCard.src} alt="" width={CARD_WIDTH} height={CARD_HEIGHT} unoptimized className="block object-contain" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} onError={(event) => { event.currentTarget.src = backOfCard.src; }} />
    </div>,
    document.body,
  );
}
