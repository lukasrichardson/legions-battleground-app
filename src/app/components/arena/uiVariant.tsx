"use client";

import { useEffect, useState } from "react";

export type UiVariant = "classic" | "arena";

const configuredVariant: UiVariant = process.env.NEXT_PUBLIC_UI_VARIANT === "classic" ? "classic" : "arena";

export function useUiVariant(): UiVariant {
  const [variant, setVariant] = useState<UiVariant>(configuredVariant);
  useEffect(() => {
    const requestedVariant = new URLSearchParams(window.location.search).get("ui");
    setVariant(requestedVariant === "classic" || requestedVariant === "arena" ? requestedVariant : configuredVariant);
  }, []);
  return variant;
}

export function variantHref(path: string, variant: UiVariant) {
  return variant === "classic" ? `${path}${path.includes("?") ? "&" : "?"}ui=classic` : path;
}
