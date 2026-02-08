"use client";
import { Suspense } from "react";
import { DecksList } from "./DecksList";
import DecksPageHeader from "./DecksPageHeader";
import PreviewDeckModal from "../components/Modals/PreviewDeckModal";
import { SessionProvider } from 'next-auth/react';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FullPage from "../components/FullPage";


export default function BasePage() {
  return (
    <Suspense>
      <SessionProvider>
        <DndProvider backend={HTML5Backend}>
          <FullPage showBreadcrumbs={true}>
            <DecksPageHeader />
            <DecksList />
          </FullPage>
          <PreviewDeckModal />
        </DndProvider>
      </SessionProvider>
    </Suspense>
  )
}
