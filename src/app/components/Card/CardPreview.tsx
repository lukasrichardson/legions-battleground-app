
"use client";
import { useAppSelector } from "@/client/redux/hooks";
import CardImage from "./CardImage";

//preview for toolbar in game. deck builder and gallery have their own versions of preview
export default function CardPreview({}) {
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const gameState = useAppSelector((state) => state.gameState);
  const { cardInFocus, previousCardInFocus, side } = clientGameState;
  const { p1SelectedCards, p2SelectedCards } = gameState;
  const p1 = side === "p1";
  const lastSelectedCard = p1 ? p1SelectedCards[p1SelectedCards.length - 1] : p2SelectedCards[p2SelectedCards.length - 1];
  const cardToShow = lastSelectedCard || cardInFocus || previousCardInFocus;
  if (!cardToShow) return null;
  return (
    <>
    <div className="relative left-0 top-0 w-[100%] flex justify-start opacity-100 flex-col aspect-[3/4]">
      <CardImage
        src={(cardToShow ? cardToShow.img : "/back-of-card.jpg")}
        alt="back of card"
      />
    </div>
    <div className="max-h-[20%] text-xs overflow-y-auto overflow-x-hidden sidebar-scrollbar shadow-inner p-2 bg-black/50 rounded-md mt-2 border border-white/10 mb-2">
      <div className="font-bold break-words">{cardToShow?.name}</div>
      <div className="break-words whitespace-pre-wrap">{cardToShow?.text}</div>
    </div>
    </>
  )
}