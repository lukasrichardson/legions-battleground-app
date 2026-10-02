import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/lib/utils";

const inlineStatusVariants = cva("rounded-lg border px-3 py-2 text-sm", {
  variants: {
    variant: {
      info: "border-primary/30 bg-primary/10 text-primary",
      success: "border-success/30 bg-success/10 text-green-100",
      warning: "border-warning/30 bg-warning/10 text-amber-100",
      error: "border-destructive/30 bg-destructive/10 text-red-100",
    },
  },
  defaultVariants: { variant: "info" },
});

type InlineStatusProps = VariantProps<typeof inlineStatusVariants> & {
  children: ReactNode;
  className?: string;
};

export function InlineStatus({ children, variant, className }: InlineStatusProps) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn(inlineStatusVariants({ variant }), className)}>
      {children}
    </div>
  );
}
