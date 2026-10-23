import { useEffect, useState } from "react";
import { fetchBanlist } from "@/client/utils/api.utils";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";

/** One request per mounted screen; share the result with its card presentations. */
export function useBanlist() {
  const [items, setItems] = useState<BanlistItem[]>([]);
  useEffect(() => {
    let active = true;
    void fetchBanlist()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((error) => console.warn("Unable to load card status", error));
    return () => {
      active = false;
    };
  }, []);
  return items;
}
