import { ReactNode } from "react";
import AppIcon from "./AppIcon";
import LoadingState from "./LoadingState";
import { EmptyState } from "@/client/ui/empty-state";
import { Card, CardContent } from "@/client/ui/card";
import { cn } from "@/client/lib/utils";

type DeckCollectionPanelProps = {
  header: ReactNode;
  loading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "classic" | "arena";
};

const basePanelClass = "mobile-page-flow short-landscape-flow flex min-w-0 flex-col text-white sm:h-full";
const classicPanelClass = "border-white/20 bg-white/10";
const arenaPanelClass = "rounded-[2px] border-white/25 bg-[rgba(5,11,17,.71)] shadow-[0_18px_42px_rgba(0,0,0,.28)] backdrop-blur-[9px]";

export default function DeckCollectionPanel({
  header,
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
      {header}
      <CardContent className="mobile-page-flow short-landscape-flow min-w-0 flex-1 p-3 pt-0 sm:min-h-0 sm:overflow-hidden sm:p-4 sm:pt-0">
        {loading ? <LoadingState label={loadingLabel} className="h-full" /> : isEmpty ? (
          <EmptyState
            icon={<AppIcon name="decks" size={24} />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="mobile-page-flow short-landscape-flow flex min-w-0 flex-col sm:h-full sm:overflow-y-auto">
            {children}
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
