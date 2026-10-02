import { useState } from "react";
import CreateDeckModal from "../components/Modals/CreateDeckModal";
import { useAppDispatch } from "@/client/redux/hooks";
import { openImportDeckModal } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import AppIcon from "@/app/components/AppIcon";
import ActionCard from "@/app/components/ActionCard";
import PageHeader from "@/app/components/PageHeader";

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
      <PageHeader title="Your Decks" description="Create, import, and manage the decks you bring to the battleground." />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ActionCard title="Create deck" description="Start a deck from scratch" icon={<AppIcon name="create" size={18}  />} iconClassName="bg-emerald-500/20 text-emerald-200" onClick={handleCreateDeck} />
        <ActionCard title="Import deck" description="Bring one in from Toolbox" icon={<AppIcon name="import" size={18} />} iconClassName="bg-orange-500/20 text-orange-200" onClick={handleImportDeck} />
        <ActionCard title="Browse decks" description="Explore community lists" icon={<AppIcon name="browse" size={18} />} iconClassName="bg-pink-500/20 text-pink-200" onClick={handleBrowseDecks} />
      </div>
      <CreateDeckModal
        open={createDeckModalOpen}
        closeModal={() => setCreateDeckModalOpen(false)}
      />
    </div>
  )
}
