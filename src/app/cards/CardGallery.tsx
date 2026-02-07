import { CardDocument } from "@/client/interfaces/Card.mongo";
import { useState } from "react";
import Breadcrumbs from "../decks/components/Breadcrumbs";
import SearchPane from "../decks/[deckId]/components/SearchPane";

export const CardGallery = () => {
    const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);

  return (
    <div className="h-full flex flex-col p-4">
        <div className="mb-2 absolute top-2 left-2">
          <Breadcrumbs breadcrumbs={[{ name: "Home", path: "/" }]} />
        </div>
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
          <div className="w-0 lg:w-[20%] h-full relative">
            <div className="h-1/3 flex items-center justify-center">
              {hoveredCard && <img
                src={hoveredCard.featured_image}
                alt={hoveredCard.title || 'Card Preview'}
                className="object-cover hover:scale-200 relative top-0 right-0 transition-transform duration-200 origin-top-right max-h-full"
                sizes="256px"
              />}
            </div>
            <div className="h-2/3">
              {hoveredCard && (
                <div className="h-full flex flex-col justify-start p-2 gap-2">
                  {hoveredCard.title && <h2 className="text-white text-lg font-bold p2 flex-1 bg-blue-200/15 rounded">{hoveredCard.title}</h2>}
                  {hoveredCard.text && <div className="h-full overflow-scroll flex-5"><p className="text-gray-300 text-sm p-2 whitespace-pre-wrap  bg-blue-200/15 rounded">{hoveredCard.text}</p></div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}