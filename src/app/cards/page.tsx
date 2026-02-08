"use client";

import FullPage from "../components/FullPage";
import { CardGallery } from "./CardGallery";

export default function Page() {
  return (
    <FullPage showBreadcrumbs={true}>
      <CardGallery />
    </FullPage>
  );
}