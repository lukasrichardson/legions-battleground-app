import * as React from "react";

import { cn } from "@/client/lib/utils";

/**
 * Shared class contracts for phone-safe route content. Route work should use
 * these instead of recreating fixed-height, overflow-hidden page panes.
 */
export const mobileLayoutClasses = {
  page: "mobile-page-content flex min-h-[100dvh] min-w-0 flex-col overflow-x-clip px-[var(--mobile-page-gutter)] pb-[calc(1rem+var(--safe-area-bottom))] pt-[calc(0.75rem+var(--safe-area-top))] sm:px-[var(--page-gutter)]",
  stickyAction: "mobile-sticky-action sticky bottom-0 z-20 -mx-[var(--mobile-page-gutter)] mt-auto border-t border-border bg-background/95 px-[var(--mobile-page-gutter)] pb-[calc(0.75rem+var(--safe-area-bottom))] pt-3 backdrop-blur sm:-mx-[var(--page-gutter)] sm:px-[var(--page-gutter)]",
  touchTarget: "touch-feedback min-h-[var(--touch-target-size)] min-w-[var(--touch-target-size)]",
} as const;

export type MobilePageContentProps = React.HTMLAttributes<HTMLElement> & {
  as?: "main" | "section" | "div";
};

/**
 * A vertically flowing page wrapper. The bottom padding leaves enough room
 * for device safe areas and a StickyActionBar when one is present.
 */
export function MobilePageContent({
  as: Component = "main",
  className,
  ...props
}: MobilePageContentProps) {
  return <Component className={cn(mobileLayoutClasses.page, className)} {...props} />;
}

export type StickyActionBarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Sticky action container for page-level submit/save controls. It includes
 * safe-area padding so browser and device chrome cannot cover its controls.
 */
export function StickyActionBar({ className, ...props }: StickyActionBarProps) {
  return <div className={cn(mobileLayoutClasses.stickyAction, className)} {...props} />;
}
