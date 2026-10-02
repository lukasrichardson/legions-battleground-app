import { ReactNode } from "react";
import { cn } from "@/client/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
