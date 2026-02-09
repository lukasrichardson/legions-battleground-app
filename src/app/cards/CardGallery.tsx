import { CardDocument } from "@/client/interfaces/Card.mongo";
import { useState } from "react";
import SearchPane from "../decks/[deckId]/components/SearchPane";
import Image from "next/image";

export const CardGallery = () => {
  const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);

  return (
    <>
      <div className="text-center h-[10%]">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Card Gallery
        </h1>
      </div>
      <div className="h-[90%] w-[100%] flex">
        <div className="w-full lg:w-[80%]">
          <SearchPane
            setHoveredCard={setHoveredCard}
            handleAddCardToDeck={() => null}
            deckLegion={null}
            gallery
          />
        </div>
        <div className="hidden lg:flex w-[20%] h-full relative flex-col items-center justify-start">
          <div className="h-1/2 relative aspect-[3/4]">
            {hoveredCard && <Image
              src={hoveredCard.featured_image}
              alt={hoveredCard.title || 'Card Preview'}
              className="hover:scale-200 relative top-0 right-0 transition-transform duration-200 origin-top-right object-contain w-fit"
              fill
              unoptimized
            />}
          </div>
          <div className="h-1/2">
            {hoveredCard && (
              <div className="h-full flex flex-col justify-start p-2 gap-2">
                {hoveredCard.title && <h2 className="text-white text-lg font-bold p2 flex-1 bg-blue-200/15 rounded">{hoveredCard.title}</h2>}
                {hoveredCard.text && <div className="h-full overflow-scroll flex-5"><p className="text-gray-300 text-sm p-2 whitespace-pre-wrap  bg-blue-200/15 rounded">{hoveredCard.text}</p></div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}