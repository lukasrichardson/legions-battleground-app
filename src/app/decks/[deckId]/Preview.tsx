import { PLACEHOLDER } from "./components/CardTile";
import { Card, CardContent} from "@/client/ui/card";

export default function Preview({hoveredCard}: {hoveredCard: {title: string; text: string; featured_image: string}}) {
  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardContent className="p-0 flex-1 h-full">
        {hoveredCard ? (
          <div className="h-full flex justify-center">
            <div className="h-full rounded-lg flex-2 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hoveredCard.featured_image}
                alt={hoveredCard.title}
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
                className="aspect-[3/4] h-auto object-cover"
              />
            </div>
            <div className="space-y-2 flex-4 h-full overflow-scroll">
              <h3 className="text-sm font-semibold text-white">{hoveredCard.title}</h3>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{hoveredCard.text}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 h-full flex flex-col items-center justify-center">
            <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No card selected</p>
            <p className="text-gray-500 text-xs mt-1">Hover over a card to see details</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}