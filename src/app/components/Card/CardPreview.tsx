
"use client";
import { useAppSelector } from "@/client/redux/hooks";
import Image from "next/image";

export default function CardPreview({}) {
  const gameState = useAppSelector((state) => state.gameState);
  if (!gameState.cardInFocus && !gameState.previousCardInFocus) return null;
  return (
    <>
    <div className="relative left-0 top-0 w-[100%] flex justify-start opacity-100 flex-col">
      <Image
        style={{ width: '100%', height: '100%', position: 'relative' }}
        width={400}
        height={400}
        src={(gameState.cardInFocus ? gameState.cardInFocus.img : gameState.previousCardInFocus?.img) || "/back-of-card.jpg"}
        alt="back of card"
        unoptimized
      />
      
    </div>
    <div className="max-h-[20%] text-xs overflow-scroll shadow-inner p-2 bg-black/50 rounded-md mt-2 border border-white/10 mb-2">
      <div className="font-bold">{gameState.cardInFocus?.name || gameState.previousCardInFocus?.name}</div>
      <div className="">{gameState.cardInFocus?.text || gameState.previousCardInFocus?.text}</div>
    </div>
    </>
  )
}