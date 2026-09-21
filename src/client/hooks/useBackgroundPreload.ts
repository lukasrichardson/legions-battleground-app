import { useEffect } from "react";
import { fetchCards } from "../utils/api.utils";
import { preloadAllCardsBackground } from "../utils/imagePreloader";

export default function useBackgroundPreload() {
  useEffect(() => {
      const startBackgroundPreload = async () => {
        try {
          const res = await fetchCards({ page: 1, pageSize: 50 }); // Limit homepage background preloading to 50 cards.
          if (res?.cards?.length) {
            preloadAllCardsBackground(res.cards);
          }
        } catch (error) {
          console.warn('[Home] Background preload failed:', error);
        }
      };
  
      const timer = setTimeout(startBackgroundPreload, 2000);
      return () => clearTimeout(timer);
    }, []);
}
