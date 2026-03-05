import { Card, CardContent } from "@/client/ui/card";
import CardImage from "@/app/components/Card/CardImage";
import back_of_card from "PUBLIC/back_of_card.jpg";
import { decodeHTMLEntities } from "@/shared/string.utils";

export default function Preview({ hoveredCard }: { hoveredCard: { title: string; text: string; featured_image: string } }) {
  const cardToUse = hoveredCard || { title: "No card selected", text: "Hover over a card to see details", featured_image: back_of_card.src };
  
  // Decode HTML entities in card data
  const decodedCard = {
    ...cardToUse,
    title: decodeHTMLEntities(cardToUse.title),
    text: decodeHTMLEntities(cardToUse.text)
  };
  
  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardContent className="p-0 flex-1 h-full">
        <div className="h-full flex justify-center">
          <div className="rounded-lg flex items-start justify-center relative w-1/2">
            <CardImage
              src={decodedCard.featured_image}
              alt={decodedCard.title}
              className="aspect-[3/4] object-contain object-top hover:scale-250 hover:top-0 hover:right-0 transition-transform duration-200 origin-top-right hover:z-95"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2 h-full">
            <h3 className="text-sm font-semibold text-white flex-shrink-0">{decodedCard.title}</h3>
            <div className="bg-white/5 rounded-lg p-2 flex-1 overflow-y-auto min-h-0">
              <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{decodedCard.text}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}