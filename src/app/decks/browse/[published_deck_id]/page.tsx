import { Suspense } from "react";
import PublishedDeckViewer from "./PublishedDeckViewer";

export default function BasePage({ }) {
  return (
    <Suspense>
      <PublishedDeckViewer />
    </Suspense>
  )
}
