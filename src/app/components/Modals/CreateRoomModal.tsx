import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { setCreateRoomModalOpen } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input } from "@/client/ui/input";
import { useDeckPickerOptions } from "@/client/hooks/useDeckPickerOptions";
import { useAuth } from "@/client/hooks/useAuth";
import { refreshSocketConnection } from "@/client/socket";
import { InlineStatus } from "@/client/ui/inline-status";
import LoadingState from "../LoadingState";
import PublicDeckPickerField from "../PublicDeckPickerField";
import PublicModalForm, { publicModalFieldClassName, publicModalInputClassName, publicModalLabelClassName } from "../PublicModalForm";
import PublicFormSubmitButton from "../PublicFormSubmitButton";
import PublicModalHeader from "../PublicModalHeader";

const ModalConstants = {
  LoadingText: "Creating your game...",
  RoomNameLabelText: "Room Name",
  YourNameLabelText: "Battleground username",
  DeckLabelText: "Deck",
  SandboxModeLabelText: "Sandbox Mode",
  CreateGameBtnText: "Create New Game",
  RoomPasswordLabelText: "Room Password (Optional)",
}

export default function CreateRoomModal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modalsState = useAppSelector((state) => state.modalsState);
  const { isAuthenticated } = useAuth();
  const { createRoomModalOpen } = modalsState;
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [sandboxMode, setSandboxMode] = useState(true);
  const [deckId, setDeckId] = useState("");
  const [p2DeckId, setP2DeckId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { options: decks, loading: decksLoading, error: decksError } = useDeckPickerOptions(Boolean(createRoomModalOpen && isAuthenticated));

  const {
    LoadingText,
    RoomNameLabelText,
    YourNameLabelText,
    DeckLabelText,
    SandboxModeLabelText,
    CreateGameBtnText,
    RoomPasswordLabelText,
  } = ModalConstants;

  const resetForm = () => {
    setRoomName("");
    setPlayerName("");
    setRoomPassword("");
    setSandboxMode(true);
    setDeckId("");
    setP2DeckId("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    dispatch(setCreateRoomModalOpen(false));
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check authentication before proceeding
    if (!isAuthenticated) {
      setError("Please sign in to create a room");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${window.location.origin}/createRoom`, {
        roomName,
        sandboxMode,
        deckId,
        p2DeckId,
        roomPassword,
      });
      const { roomName: newRoomName, playerName: alias, admissionToken } = res.data;
      const query = new URLSearchParams({ room: newRoomName, playerName: alias, deckId });
      if (p2DeckId) query.set("p2DeckId", p2DeckId);
      await refreshSocketConnection(admissionToken);
      router.push(`/play?${query.toString()}`);
      handleClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Error handled by UI feedback
        setError("Error: " + error.message || " An Error Occurred, try again");
      } else {
        setError("Error: " + error || " An Error Occurred, try again");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!createRoomModalOpen) return;
    setDeckId(decks[0]?._id || "");
    const loadAlias = async () => {
      try {
        const response = await axios.get("/api/me/alias");
        setPlayerName(response.data.alias || "");
      } catch {
        setPlayerName("");
      }
    };
    if (isAuthenticated) void loadAlias();
  }, [createRoomModalOpen, decks, isAuthenticated]);

  const onSandboxModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSandboxMode(e.target.checked);
  }

  const handleDeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== deckId) {
      setDeckId(selectedId);
    }
  }

  const handleP2DeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== p2DeckId) {
      setP2DeckId(selectedId);
    }
  }

  const renderModalContent = () => (
    <PublicModalForm>
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Room Name */}
              <div className={publicModalFieldClassName}>
                <label htmlFor="create-room-name" className={publicModalLabelClassName}>
                  {RoomNameLabelText}
                </label>
                <Input
                  id="create-room-name"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  name="roomName"
                  autoComplete="on"
                  className={publicModalInputClassName}
                  placeholder="Enter room name"
                  required
                />
              </div>

              {/* Player Name */}
              <div className={publicModalFieldClassName}>
                <label htmlFor="create-room-username" className={publicModalLabelClassName}>
                  {YourNameLabelText}
                </label>
                <Input
                  id="create-room-username"
                  type="text"
                  value={playerName || auth?.user?.name || ""}
                  readOnly
                  name="playerName"
                  autoComplete="on"
                  className={publicModalInputClassName}
                />
              </div>
            </div>

            {/* Deck  Section */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <PublicDeckPickerField label={DeckLabelText} value={deckId} onValueChange={handleDeckChange} options={decks} loading={decksLoading} error={decksError} />
              <PublicDeckPickerField label={`P2 ${DeckLabelText} (Optional)`} value={p2DeckId} onValueChange={handleP2DeckChange} options={decks} loading={decksLoading} error={decksError} />
            </div>

            {/* Room Password */}
            <div className={publicModalFieldClassName}>
              <label htmlFor="create-room-password" className={publicModalLabelClassName}>
                {RoomPasswordLabelText}
              </label>
              <Input
                id="create-room-password"
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className={publicModalInputClassName}
                placeholder="Leave empty for no password"
              />
            </div>

            {/* Sandbox Mode */}
            <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="relative">
                <input
                  id="create-room-sandbox"
                  type="checkbox"
                  name="sandbox"
                  checked={sandboxMode}
                  onChange={onSandboxModeChange}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="create-room-sandbox" className="text-sm font-semibold text-white">{SandboxModeLabelText}</label>
                <p className="text-xs text-gray-400">Enable free-form sandbox play, or disable it for a regular match.</p>
              </div>
            </div>

            {/* Error Display */}
            {error && <InlineStatus variant="error">{error}</InlineStatus>}

            {/* Submit Button */}
            <PublicFormSubmitButton loading={loading} loadingLabel="Creating game…" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <span>{CreateGameBtnText}</span>
            </PublicFormSubmitButton>
          </form>
    </PublicModalForm>
  );

  return (
    <Modal
      open={createRoomModalOpen}
      closeModal={handleClose}
      modalHeader={<PublicModalHeader title={CreateGameBtnText} icon="create" onClose={handleClose} closeLabel="Close create game" />}
      modalContent={loading ? <LoadingState label={LoadingText} className="min-h-64 border-white/20 bg-white/10" /> : renderModalContent()}
    />
  )
}
