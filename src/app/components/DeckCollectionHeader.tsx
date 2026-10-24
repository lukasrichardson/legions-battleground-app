import { Button } from "@/client/ui/button";
import { MultiSelect } from "@/client/ui/multiselect";

type DeckCollectionHeaderProps = {
  title?: string;
  count: number;
  legions: string[];
  selectedLegions: string[];
  onLegionsChange: (legions: string[]) => void;
};

export default function DeckCollectionHeader({ title, count, legions, selectedLegions, onLegionsChange }: DeckCollectionHeaderProps) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-3 border-b border-white/15 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {title && <h3 className="font-serif text-lg font-medium text-[#e2f1ff]">{title}</h3>}
        <span className="text-sm text-slate-300" aria-live="polite">{count} {count === 1 ? "deck" : "decks"}</span>
      </div>
      <div role="group" aria-label="Filter by legion" className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm text-slate-200">Filter by legion</span>
        <MultiSelect
          className="max-w-full [&_button]:min-h-[var(--touch-target-size)]"
          options={legions.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))}
          value={selectedLegions}
          onChange={onLegionsChange}
          placeholder="All legions"
          menuPlacement="viewport"
        />
        {selectedLegions.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onLegionsChange([])} className="min-h-11 text-slate-300 hover:text-white">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
