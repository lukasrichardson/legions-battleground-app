"use client";
import { Suspense } from "react";
import { DecksList } from "./DecksList";
import DecksPageHeader from "./DecksPageHeader";
import PreviewDeckModal from "../components/Modals/PreviewDeckModal";
import { SessionProvider } from 'next-auth/react';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function Page() {
  return (
    <SessionProvider>
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="h-full flex flex-col px-4 py-6">
          <DecksPageHeader />
          <DecksList />
        </div>
      </div>
    </SessionProvider>
  );
}

export default function BasePage() {
  return (
    <Suspense>
      <SessionProvider>
        <DndProvider backend={HTML5Backend}>
          <Page />
          <PreviewDeckModal />
        </DndProvider>
      </SessionProvider>
    </Suspense>
  )
}
