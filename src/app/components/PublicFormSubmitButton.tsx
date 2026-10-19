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
      className={cn("w-full border border-sky-200/45 bg-[#246fb8] py-4 text-base font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] transition hover:bg-[#338de0] focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50", className)}
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
