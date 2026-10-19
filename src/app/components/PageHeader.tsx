import { ReactNode } from "react";
import { cn } from "@/client/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: "classic" | "arena";
};

export default function PageHeader({ title, description, actions, className, variant = "classic" }: PageHeaderProps) {
  return (
    <header className={cn(variant === "arena" ? "mb-[18px] flex flex-col gap-3 border-b border-white/25 px-0.5 pb-4 pt-1 sm:flex-row sm:items-end sm:justify-between" : "mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className={variant === "arena" ? "font-serif text-[clamp(27px,3vw,38px)] font-medium tracking-[-.025em] text-[#edf7ff]" : "text-xl font-bold tracking-tight text-white sm:text-2xl"}>{title}</h1>
        {description && <p className={variant === "arena" ? "mt-1 max-w-2xl text-sm text-[#d9e2e9] sm:text-base" : "mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base"}>{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
