import { type ReactNode } from "react";
import { Button } from "@/client/ui/button";
import { cn } from "@/client/lib/utils";

type PublicFormSubmitButtonProps = {
  children: ReactNode;
  loading: boolean;
  loadingLabel: string;
  className?: string;
};

/** Shared submit treatment for forms displayed outside a game. */
export default function PublicFormSubmitButton({ children, loading, loadingLabel, className }: PublicFormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className={cn("w-full rounded-xl py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50", className)}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>{loadingLabel}</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">{children}</span>
      )}
    </Button>
  );
}
