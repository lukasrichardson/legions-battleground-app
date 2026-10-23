"use client";
import { Suspense } from "react";
import { DecksList } from "./DecksList";
import DecksPageHeader from "./DecksPageHeader";
import PreviewDeckModal from "../components/Modals/PreviewDeckModal";
import { SessionProvider } from 'next-auth/react';
import FullPage from "../components/FullPage";


export default function BasePage() {
  return (
    <Suspense>
      <SessionProvider>
        <FullPage showBreadcrumbs={false} scrollOnShortLandscape>
          <DecksPageHeader />
          <DecksList />
        </FullPage>
        <PreviewDeckModal />
      </SessionProvider>
    </Suspense>
  )
}
