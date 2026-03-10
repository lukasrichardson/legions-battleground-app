"use client";

import { DndProvider } from "react-dnd";
import { CardGallery } from "./CardGallery";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function Page() {
  return (
    <DndProvider backend={HTML5Backend}>
        <CardGallery />
    </DndProvider>
  );
}