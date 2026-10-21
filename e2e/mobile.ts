import { expect, type Locator, type Page } from "@playwright/test";

/** The phone sizes supported by the mobile UI contract. */
export const mobileViewports = {
  narrow: { width: 320, height: 568 },
  standard: { width: 390, height: 844 },
  wide: { width: 414, height: 896 },
  landscape: { width: 568, height: 320 },
  landscapeWide: { width: 667, height: 375 },
} as const;

export type MobileViewportName = keyof typeof mobileViewports;

/**
 * An intentional horizontal strip must declare both attributes in production
 * markup. Keeping the exemption in markup makes it reviewable in a screenshot
 * and prevents a test from silently exempting an unrelated overflowing button.
 */
export const mobileOverflowExemptionAttribute = "data-mobile-overflow-exempt";
export const mobileOverflowAffordanceAttribute = "data-mobile-horizontal-scroll-affordance";

const interactiveSelector = [
  "button",
  "a[href]",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "[role=button]",
  "[role=link]",
  "[role=checkbox]",
  "[role=combobox]",
  "[role=menuitem]",
  "[role=option]",
  "[role=radio]",
  "[role=switch]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export async function setMobileViewport(page: Page, viewport: MobileViewportName = "standard") {
  await page.setViewportSize(mobileViewports[viewport]);
}

export async function expectNoDocumentHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

/**
 * Ensures every visible, tappable control is entirely within the current
 * viewport. This deliberately checks fixed/sticky controls too: a primary
 * action hidden behind the browser edge is still inaccessible to a user.
 *
 * Only card-strip and hand-tray elements may be exempted. They need a named
 * production attribute plus a visible scroll affordance attribute; form, nav,
 * room-list, and primary-action controls cannot be excluded.
 */
export async function expectVisibleInteractiveElementsInViewport(page: Page) {
  const violations = await page.locator(interactiveSelector).evaluateAll((elements, attributes) => {
    const allowedExemptions = new Set(["card-strip", "hand-tray"]);
    const forbiddenExemptionAncestors = "form, nav, [role=navigation], [data-mobile-primary-action], [data-mobile-room-list]";

    return elements.flatMap((element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      const isVisible = style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0
        && htmlElement.getClientRects().length > 0
        && rect.right > 0
        && rect.bottom > 0
        && rect.left < window.innerWidth
        && rect.top < window.innerHeight;

      if (!isVisible) return [];

      // Next injects this fixed development-only control outside the product
      // tree. It is not a customer-facing app action and does not ship in the
      // production build this gate protects.
      if (htmlElement.getAttribute("aria-label") === "Open Next.js Dev Tools") return [];

      const exemptContainer = htmlElement.closest(`[${attributes.exemption}]`) as HTMLElement | null;
      const exemption = exemptContainer?.getAttribute(attributes.exemption) ?? null;
      const hasAffordance = exemptContainer?.hasAttribute(attributes.affordance) ?? false;
      const hasForbiddenAncestor = Boolean(htmlElement.closest(forbiddenExemptionAncestors));
      const isAllowedExemption = exemption !== null
        && allowedExemptions.has(exemption)
        && hasAffordance
        && !hasForbiddenAncestor;

      // Browsers can place a 1px border on a fractional coordinate (for
      // example `top: -0.5`) while the painted control remains fully tappable.
      // Keep the gate strict for meaningful clipping without making every
      // device-pixel-ratio rounding difference a false failure.
      const viewportTolerance = 1;
      const outOfBounds = rect.left < -viewportTolerance
        || rect.top < -viewportTolerance
        || rect.right > window.innerWidth + viewportTolerance
        || rect.bottom > window.innerHeight + viewportTolerance;
      if (!outOfBounds || isAllowedExemption) return [];

      const description = htmlElement.getAttribute("aria-label")
        || htmlElement.textContent?.replace(/\s+/g, " ").trim().slice(0, 80)
        || htmlElement.id
        || "unlabelled interactive element";
      return [{
        description,
        tag: htmlElement.tagName.toLowerCase(),
        role: htmlElement.getAttribute("role"),
        exemption,
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      }];
    });
  }, { exemption: mobileOverflowExemptionAttribute, affordance: mobileOverflowAffordanceAttribute });

  expect(violations, `Visible interactive controls outside viewport:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
}

/**
 * Checks the mobile touch-target contract. A compact visual icon may sit inside
 * a larger button, but the interactive element itself must remain at least
 * 44 CSS pixels in both directions.
 */
export async function expectMinimumTouchTargets(page: Page, minimumSize = 44) {
  const undersized = await page.locator(interactiveSelector).evaluateAll((elements, minimum) => elements.flatMap((element) => {
    const htmlElement = element as HTMLElement;
    const style = window.getComputedStyle(htmlElement);
    const rect = htmlElement.getBoundingClientRect();
    const isVisible = style.display !== "none"
      && style.visibility !== "hidden"
      && Number(style.opacity) > 0
      && rect.width > 0
      && rect.height > 0
      && rect.right > 0
      && rect.bottom > 0
      && rect.left < window.innerWidth
      && rect.top < window.innerHeight;
    if (!isVisible || (rect.width >= minimum && rect.height >= minimum)) return [];

    if (htmlElement.getAttribute("aria-label") === "Open Next.js Dev Tools") return [];

    return [{
      description: htmlElement.getAttribute("aria-label")
        || htmlElement.textContent?.replace(/\s+/g, " ").trim().slice(0, 80)
        || "unlabelled interactive element",
      width: rect.width,
      height: rect.height,
    }];
  }), minimumSize);

  expect(undersized, `Visible controls smaller than ${minimumSize}px:\n${JSON.stringify(undersized, null, 2)}`).toEqual([]);
}

/** Assert the shared mobile contract after a route settles on a chosen viewport. */
export async function expectMobileRouteLayout(page: Page, viewport: MobileViewportName = "standard") {
  await setMobileViewport(page, viewport);
  await expectNoDocumentHorizontalOverflow(page);
  await expectVisibleInteractiveElementsInViewport(page);
  await expectMinimumTouchTargets(page);
}

/** A small utility for tests that need to assert a control can actually be tapped. */
export async function expectTapTargetVisible(target: Locator) {
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  await target.click({ trial: true });
}
