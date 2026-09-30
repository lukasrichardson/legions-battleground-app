import { useEffect, useState } from "react";
import { fetchDeckPickerOptions } from "@/client/utils/api.utils";

export type DeckPickerOption = { _id: string; name: string; legion: string };

export function useDeckPickerOptions(enabled = true, refreshKey?: unknown) {
  const [options, setOptions] = useState<DeckPickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setLoading(true);
    setError(null);
    void fetchDeckPickerOptions()
      .then((nextOptions) => {
        if (current) setOptions(nextOptions);
      })
      .catch(() => {
        if (current) setError("Failed to load decks");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [enabled, refreshKey]);

  return { options, loading, error };
}
