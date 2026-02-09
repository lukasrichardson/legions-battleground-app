import { useEffect } from "react";
import { fetchCards } from "../utils/api.utils";
import { preloadAllCardsBackground } from "../utils/imagePreloader";

export default function useBackgroundPreload() {
  useEffect(() => {
      const startBackgroundPreload = async () => {
        try {
          console.log('[Home] Starting background preload of all cards - for now just first 200 cards, adjust as needed');
          const res = await fetchCards({ page: 1, pageSize: 200 }); // Fetch first 200 cards for preload - adjust as needed
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