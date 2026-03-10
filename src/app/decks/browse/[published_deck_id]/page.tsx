"use client";
import { Suspense } from "react";
import PublishedDeckViewer from "./PublishedDeckViewer";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function BasePage({ }) {
  return (
    <Suspense>
      <DndProvider backend={HTML5Backend}>

        <PublishedDeckViewer />
      </DndProvider>
    </Suspense>
  )
}
