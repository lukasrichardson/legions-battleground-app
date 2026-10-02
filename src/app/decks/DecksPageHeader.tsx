import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/client/ui/card";
import CreateDeckModal from "../components/Modals/CreateDeckModal";
import { useAppDispatch } from "@/client/redux/hooks";
import { openImportDeckModal } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import AppIcon from "@/app/components/AppIcon";

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

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 max-w-4xl w-fit mx-auto">
        {renderActionCard({
          title: "Create",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <AppIcon name="create" className="text-white" size={16} />
          </div>),
          onClick: handleCreateDeck
        })}
        {renderActionCard({
          title: "Import",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-lg flex items-center justify-center">
            <AppIcon name="import" className="text-white" size={16} />
          </div>),
          onClick: handleImportDeck
        })}
        {renderActionCard({
          title: "Browse",
          icon: (<div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-500 rounded-lg flex items-center justify-center">
            <AppIcon name="browse" className="text-white" size={16} />
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
