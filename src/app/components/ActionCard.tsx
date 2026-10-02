import { ReactNode } from "react";
import { cn } from "@/client/lib/utils";

type ActionCardProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  onClick: () => void;
  iconClassName?: string;
  className?: string;
};

export default function ActionCard({ title, description, icon, onClick, iconClassName, className }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <span className="flex min-h-14 flex-col justify-center rounded-lg border border-white/20 bg-white/10 p-2 text-white transition-colors group-hover:bg-white/20 sm:min-h-24 sm:p-4">
        <span className="flex items-center gap-2 text-base font-semibold sm:text-lg">
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary", iconClassName)}>{icon}</span>
          {title}
        </span>
        {description && <span className="hidden sm:block mt-1 text-sm text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}
