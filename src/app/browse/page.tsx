import { Suspense } from "react";
import DeckBrowser from "./DeckBrowser";

export default function BasePage({ }) {
  return (
    <Suspense>
      <DeckBrowser />
    </Suspense>
  )
}
