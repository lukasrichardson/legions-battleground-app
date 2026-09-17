
"use client";
import { useAppSelector } from "@/client/redux/hooks";
import CardImage from "./CardImage";
import { decodeHTMLEntities } from "@/client/utils/string.util"; 

//preview for toolbar in game. deck builder and gallery have their own versions of preview
export default function CardPreview({}) {
  const cardToShow = useAppSelector((state) => {
    const { cardInFocus, previousCardInFocus, side } = state.clientGameState;
    const selectedCards = side === "p1" ? state.gameState.p1SelectedCards : state.gameState.p2SelectedCards;
    const lastSelectedCard = selectedCards[selectedCards.length - 1];
    return lastSelectedCard || cardInFocus || previousCardInFocus;
  });
  if (!cardToShow) return null;
  return (
    <>
    <div className="relative left-0 top-0 w-[100%] flex justify-start opacity-100 flex-col aspect-[3/4]">
      <CardImage src={cardToShow.img} alt="back of card" />
    </div>
    <div className="max-h-[20%] text-xs overflow-y-auto overflow-x-hidden sidebar-scrollbar shadow-inner p-2 bg-black/50 rounded-md mt-2 border border-white/10 mb-2">
      <div className="font-bold break-words">{cardToShow?.name ? decodeHTMLEntities(cardToShow.name) : ''}</div>
      <div className="break-words whitespace-pre-wrap">{cardToShow?.text ? decodeHTMLEntities(cardToShow.text) : ''}</div>
    </div>
    </>
  )
}
