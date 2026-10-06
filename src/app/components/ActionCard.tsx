import { ReactNode } from "react";
import { cn } from "@/client/lib/utils";

type ActionCardProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  onClick: () => void;
  iconClassName?: string;
  className?: string;
  variant?: "classic" | "arena";
  compact?: boolean;
};

const baseButtonClass = "group w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const classicCardClass = "rounded-lg border-white/20 bg-white/10 group-hover:bg-white/20";
const arenaCardClass = "rounded-[2px] border-white/25 bg-[rgba(5,11,17,.62)] group-hover:bg-blue-400/10";
const compactContentClass = "min-h-[54px] items-center p-1.5 text-center sm:min-h-24 sm:p-4 sm:text-left";
const defaultContentClass = "min-h-14 p-2 sm:min-h-24 sm:p-4";

export default function ActionCard({ title, description, icon, onClick, iconClassName, className, variant = "classic", compact = false }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(baseButtonClass, variant === "arena" ? "rounded-[2px]" : "rounded-lg", className)}
    >
      <span className={cn("flex flex-col justify-center border text-white transition-colors", compact ? compactContentClass : defaultContentClass, variant === "arena" ? arenaCardClass : classicCardClass)}>
        <span className={cn("flex items-center gap-2 text-base font-semibold sm:text-lg", compact && "justify-center gap-1 text-xs sm:gap-2 sm:text-lg")}>
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary", iconClassName)}>{icon}</span>
          {title}
        </span>
        {description && <span className="mt-1 hidden text-sm text-muted-foreground sm:block">{description}</span>}
      </span>
    </button>
  );
}
