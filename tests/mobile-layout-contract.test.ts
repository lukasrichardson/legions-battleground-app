import { describe, expect, it } from "vitest";

import { mobileLayoutClasses } from "../src/client/ui/mobile-layout";
import { buttonVariants } from "../src/client/ui/button";

describe("mobile layout contracts", () => {
  it("keeps page content shrinkable, safe-area aware, and dynamic-viewport sized", () => {
    expect(mobileLayoutClasses.page).toContain("min-w-0");
    expect(mobileLayoutClasses.page).toContain("min-h-[100dvh]");
    expect(mobileLayoutClasses.page).toContain("safe-area-bottom");
  });

  it("keeps sticky actions above the safe area and out of normal content flow", () => {
    expect(mobileLayoutClasses.stickyAction).toContain("sticky bottom-0");
    expect(mobileLayoutClasses.stickyAction).toContain("safe-area-bottom");
  });

  it("uses the shared 44px touch target for standard and icon buttons", () => {
    expect(mobileLayoutClasses.touchTarget).toContain("--touch-target-size");
    expect(buttonVariants()).toContain("min-h-[var(--touch-target-size)]");
    expect(buttonVariants({ size: "icon" })).toContain("w-[var(--touch-target-size)]");
  });
});
