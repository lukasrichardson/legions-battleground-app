import { useId } from "react";
import type { DeckPickerOption } from "@/client/hooks/useDeckPickerOptions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { InlineStatus } from "@/client/ui/inline-status";
import { publicModalFieldClassName, publicModalLabelClassName, publicModalSelectClassName } from "./PublicModalForm";

type PublicDeckPickerFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: DeckPickerOption[];
  loading: boolean;
  error: string | null;
};

/** Deck picker presentation for public/lobby forms; it intentionally does not alter the shared Select primitive. */
export default function PublicDeckPickerField({ label, value, onValueChange, options, loading, error }: PublicDeckPickerFieldProps) {
  const selectId = useId();
  const unavailable = loading || Boolean(error) || options.length === 0;
  const placeholder = loading ? "Loading decks…" : error ? "Decks unavailable" : options.length === 0 ? "No decks available" : "Select a deck";

  return (
    <div className={publicModalFieldClassName}>
      <label htmlFor={selectId} className={publicModalLabelClassName}>{label}</label>
      <Select value={value} onValueChange={onValueChange} disabled={unavailable}>
        <SelectTrigger id={selectId} className={publicModalSelectClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-white/20 bg-slate-800 text-white">
          {options.map((option) => (
            <SelectItem key={option._id} value={option._id} className="text-white hover:bg-white/10 focus:bg-white/10">
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <InlineStatus variant="error" className="py-1.5 text-xs">{error}</InlineStatus>}
      {!loading && !error && options.length === 0 && <p className="text-xs text-muted-foreground">Create a deck first to use it in a room.</p>}
    </div>
  );
}
