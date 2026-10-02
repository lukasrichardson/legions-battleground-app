import { ReactNode } from "react";
import { cn } from "@/client/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex h-full min-h-48 flex-col items-center justify-center px-4 py-8 text-center", className)}>
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground" aria-hidden="true">{icon}</div>}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
