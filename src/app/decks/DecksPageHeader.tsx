import { useState } from "react";
import Breadcrumbs from "./components/Breadcrumbs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/client/ui/card";
import CreateDeckModal from "../components/Modals/CreateDeckModal";
import { useAppDispatch } from "@/client/redux/hooks";
import { openImportDeckModal } from "@/client/redux/modalsSlice";

export default function DecksPageHeader() {
  const dispatch = useAppDispatch();
  const [createDeckModalOpen, setCreateDeckModalOpen] = useState(false);

  const handleCreateDeck = () => {
    setCreateDeckModalOpen(true);
  }
  
  const handleImportDeck = () => {
      dispatch(openImportDeckModal());
    }

  return (
    <div className="mb-6">
      {/* Breadcrumbs - Top Left */}
      <div className="mb-2">
        <Breadcrumbs breadcrumbs={[{name: "Home", path: "/"}]} />
      </div>
      
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Decks
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
          Create and Edit your decks
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
        <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleCreateDeck}>
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              Create Deck
            </CardTitle>
            <CardDescription className="text-gray-300 text-xs sm:text-sm">
              Build a new deck from scratch
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleImportDeck}>
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              Import Deck
            </CardTitle>
            <CardDescription className="text-gray-300 text-xs sm:text-sm">
              Import deck from Toolbox
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Create Deck Modal */}
      <CreateDeckModal
        open={createDeckModalOpen}
        closeModal={() => setCreateDeckModalOpen(false)}
      />
    </div>
  )
}