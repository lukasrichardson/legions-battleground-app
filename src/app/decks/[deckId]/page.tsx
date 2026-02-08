"use client";

import { Suspense } from "react";
import DeckBuilder from "./DeckBuilder"
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function BasePage({ }) {
  return (
    <Suspense>
      <DndProvider backend={HTML5Backend}>
        <DeckBuilder />
      </DndProvider>
    </Suspense>
  )
}
