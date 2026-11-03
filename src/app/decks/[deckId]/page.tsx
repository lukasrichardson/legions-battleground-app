"use client";

import { Suspense } from "react";
import DeckBuilder from "./DeckBuilder"
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CardDragPreview from "@/app/components/Card/CardDragPreview";

export default function BasePage({ }) {
  return (
    <Suspense>
      <DndProvider backend={HTML5Backend}>
        <CardDragPreview />
        <DeckBuilder />
      </DndProvider>
    </Suspense>
  )
}
