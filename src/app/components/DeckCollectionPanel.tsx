import { ReactNode } from "react";
import AppIcon from "./AppIcon";
import LoadingState from "./LoadingState";
import { EmptyState } from "@/client/ui/empty-state";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";

type DeckCollectionPanelProps = {
  title: string;
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
};

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
}: DeckCollectionPanelProps) {
  return (
    <Card className="flex h-full flex-col border-white/20 bg-white/10 text-white">
      <CardHeader className="flex shrink-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 p-4 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
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
          <div className="flex h-full flex-col overflow-auto">
            {children}
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
