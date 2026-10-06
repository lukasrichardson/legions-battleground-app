import { ReactNode } from "react";
import AppIcon from "./AppIcon";
import LoadingState from "./LoadingState";
import { EmptyState } from "@/client/ui/empty-state";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { cn } from "@/client/lib/utils";

type DeckCollectionPanelProps = {
  title?: string;
  count: number;
  filter: ReactNode;
  onClearFilters?: () => void;
  loading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "classic" | "arena";
};

const basePanelClass = "flex h-full flex-col text-white";
const classicPanelClass = "border-white/20 bg-white/10";
const arenaPanelClass = "rounded-[2px] border-white/25 bg-[rgba(5,11,17,.71)] shadow-[0_18px_42px_rgba(0,0,0,.28)] backdrop-blur-[9px]";
const baseHeaderClass = "flex shrink-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 p-4 pb-2";

export default function DeckCollectionPanel({
  title,
  count,
  filter,
  onClearFilters,
  loading,
  loadingLabel,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
  footer,
  variant = "classic",
}: DeckCollectionPanelProps) {
  return (
    <Card className={cn(basePanelClass, variant === "arena" ? arenaPanelClass : classicPanelClass)}>
      <CardHeader className={cn(baseHeaderClass, variant === "arena" && "border-b border-white/15")}>
        {title && <CardTitle className={variant === "arena" ? "font-serif text-lg font-medium text-[#e2f1ff]" : "text-lg"}>{title}</CardTitle>}
        <span className="text-sm text-muted-foreground">{count} decks</span>
        <div className="ml-0 flex items-center gap-2 sm:ml-2">
          {filter}
          {onClearFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground hover:text-white">
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-4 pt-0">
        {loading ? <LoadingState label={loadingLabel} className="h-full" /> : isEmpty ? (
          <EmptyState
            icon={<AppIcon name="decks" size={24} />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="flex h-full flex-col overflow-y-auto">
            {children}
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
