"use client";

import { Suspense } from "react";
import DeckBuilder from "./DeckBuilder"
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function Page() {

  

  return (
    <div>
      <main className="relative flex flex-col justify-center items-center h-screen w-screen">
        <DndProvider backend={HTML5Backend}>
          <DeckBuilder />
        </DndProvider>
      </main>
    </div>
  );
}

export default function BasePage({}) {
  return (
    <Suspense>
      <Page />
    </Suspense>
  )
}
