import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/client/ui/card";
import CreateDeckModal from "../components/Modals/CreateDeckModal";
import { useAppDispatch } from "@/client/redux/hooks";
import { openImportDeckModal } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";

const renderActionCard = ({
  title,
  icon,
  onClick
}: {
  title: string;
  icon: JSX.Element;
  onClick: () => void;
}) => (
  <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer w-fit mx-auto" onClick={onClick}>
    <CardHeader className="p-0.5 sm:p-2">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
  </Card>
);

export default function DecksPageHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createDeckModalOpen, setCreateDeckModalOpen] = useState(false);

  const handleCreateDeck = () => {
    setCreateDeckModalOpen(true);
  }

  const handleImportDeck = () => {
    dispatch(openImportDeckModal());
  }

  const handleBrowseDecks = () => {
    router.push("/decks/browse");
  }

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Decks
        </h1>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-4xl w-fit mx-auto">
        {renderActionCard({
          title: "Create Deck",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>),
          onClick: handleCreateDeck
        })}
        {renderActionCard({
          title: "Import Deck",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>),
          onClick: handleImportDeck
        })}
        {renderActionCard({
          title: "Browse Public Decks",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>),
          onClick: handleBrowseDecks
        })}

      </div>

      {/* Create Deck Modal */}
      <CreateDeckModal
        open={createDeckModalOpen}
        closeModal={() => setCreateDeckModalOpen(false)}
      />
    </div>
  )
}