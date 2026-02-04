
"use client";
import { useAppSelector } from "@/client/redux/hooks";
// import Image from "next/image";

export default function CardPreview({}) {
  const gameState = useAppSelector((state) => state.gameState);
  if (!gameState.cardInFocus && !gameState.previousCardInFocus) return null;
  return (
    // old fixed card preview <div className="fixed left-0 top-0 w-[21vw] h-[30vw] flex justify-start opacity-100" style={{ transform: `scale(${smallestScale}, ${smallestScale})`, transformOrigin: 'left top', zIndex: 1000, pointerEvents: 'none' }}>
    <>
    <div className="relative left-0 top-0 w-[100%] flex justify-start opacity-100 flex-col">
      <img
        style={{ width: '100%', height: '100%', position: 'relative' }}
        width={400}
        height={400}
        src={(gameState.cardInFocus ? gameState.cardInFocus.img : gameState.previousCardInFocus?.img) || "/frt-031.png"}
        alt="back of card"
      />
      {/* <Image
        style={{ width: '100%', height: '100%', position: 'relative' }}
        width={400}
        height={400}
        src={(gameState.cardInFocus ? gameState.cardInFocus.img : gameState.previousCardInFocus?.img) || "/frt-031.png"}
        alt="back of card"
      /> */}
      
    </div>
    <div className="max-h-[20%] text-xs overflow-scroll shadow-inner p-2 bg-black/50 rounded-md mt-2 border border-white/10 mb-2">
      <div className="font-bold">{gameState.cardInFocus?.name || gameState.previousCardInFocus?.name}</div>
      <div className="">{gameState.cardInFocus?.text || gameState.previousCardInFocus?.text}</div>
    </div>
    </>
  )
}