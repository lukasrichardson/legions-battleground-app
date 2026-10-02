import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { setJoinRoomModalOpen } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { useAuth } from "@/client/hooks/useAuth";
import { signIn } from "next-auth/react";
import { useDeckPickerOptions } from "@/client/hooks/useDeckPickerOptions";
import { refreshSocketConnection } from "@/client/socket";
import { InlineStatus } from "@/client/ui/inline-status";
import AppIcon from "../AppIcon";
import LoadingState from "../LoadingState";
import PublicDeckPickerField from "../PublicDeckPickerField";
import PublicModalForm, { publicModalFieldClassName, publicModalInputClassName, publicModalLabelClassName } from "../PublicModalForm";
import PublicFormSubmitButton from "../PublicFormSubmitButton";
import PublicModalHeader from "../PublicModalHeader";

const ModalConstants = {
  LoadingText: "Loading...",
  RoomNameLabelText: "Room Name",
  YourNameLabelText: "Battleground username",
  DeckLabelText: "Deck",
  SandboxModeLabelText: "Sandbox Mode",
  CreateGameBtnText: "Create Game",
  JoinRoomBtnText: "Join Room",
  RoomPasswordLabelText: "Room Password"
}

export default function JoinRoomModal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modalsState = useAppSelector((state) => state.modalsState);
  const { isAuthenticated } = useAuth();
  const { joinRoomModalOpen } = modalsState;
  const [playerName, setPlayerName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [error, setError] = useState("");
  const [deckId, setDeckId] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { options: decks, loading: decksLoading, error: decksError } = useDeckPickerOptions(Boolean(joinRoomModalOpen && isAuthenticated));

  const {
    LoadingText,
    RoomNameLabelText,
    YourNameLabelText,
    JoinRoomBtnText,
    RoomPasswordLabelText,
    DeckLabelText
  } = ModalConstants;

  const resetForm = () => {
    setPlayerName("");
    setRoomPassword("");
    setDeckId("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    dispatch(setJoinRoomModalOpen(null));
  };

  const handleJoinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check authentication before proceeding
    if (!isAuthenticated) {
      setError("Please sign in to join a room");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post(`${window.location.origin}/joinRoom`, {
        roomName: joinRoomModalOpen,
        deckId,
        roomPassword
      });
      const { roomName: newRoomName, playerName: alias, admissionToken } = res.data;
      const query = new URLSearchParams({ room: newRoomName, playerName: alias, deckId });
      await refreshSocketConnection(admissionToken);
      router.push(`/play?${query.toString()}`);
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Invalid request. Please check your inputs.");
      } else {
        setError("An error occurred while joining the room. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!joinRoomModalOpen) return;
    const loadAlias = async () => {
      try {
        const response = await axios.get("/api/me/alias");
        setPlayerName(response.data.alias || "");
      } catch {
        setPlayerName("");
      }
    };
    if (isAuthenticated) void loadAlias();
  }, [isAuthenticated, joinRoomModalOpen])

  const renderAuthRequired = () => (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4 shadow-lg">
        <AppIcon name="sign-in-required" className="text-white" size={32} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Sign In Required</h2>
      <p className="text-gray-300 mb-6">You need to be signed in to join a room.</p>
      <Button 
        onClick={() => signIn()}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
      >
        Sign In
      </Button>
    </div>
  );

  const handleDeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== deckId) {
      setDeckId(selectedId);
    }
  }

  const renderModalContent = () => (
    <PublicModalForm>
          <form onSubmit={handleJoinRoom} className="space-y-6">
            {/* Room Name Input */}
            <div className={publicModalFieldClassName}>
              <label htmlFor="join-room-name" className={publicModalLabelClassName}>
                {RoomNameLabelText}
              </label>
              <Input
                id="join-room-name"
                type="text"
                value={joinRoomModalOpen}
                disabled={true}
                name="roomName"
                className={publicModalInputClassName}
              />
            </div>

            {/* Grid Layout for Name and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player Name Input */}
              <div className={publicModalFieldClassName}>
                <label htmlFor="join-room-username" className={publicModalLabelClassName}>
                  {YourNameLabelText}
                </label>
                <Input
                  id="join-room-username"
                  type="text"
                  value={playerName || auth?.user?.name || ""}
                  disabled={true}
                  name="playerName"
                  autoComplete="on"
                  autoFocus
                  className={publicModalInputClassName}
                />
              </div>

              {/* Room Password Input */}
              <div className={publicModalFieldClassName}>
                <label htmlFor="join-room-password" className={publicModalLabelClassName}>
                  {RoomPasswordLabelText}
                </label>
                <Input
                  id="join-room-password"
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Optional"
                  className={publicModalInputClassName}
                />
              </div>
            </div>

            {/* Deck  Section */}
            <PublicDeckPickerField label={DeckLabelText} value={deckId} onValueChange={handleDeckChange} options={decks} loading={decksLoading} error={decksError} />

            {/* Error Display */}
            {error && <InlineStatus variant="error">{error}</InlineStatus>}

            {/* Submit Button */}
            <PublicFormSubmitButton loading={loading} loadingLabel="Joining room…" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
              <AppIcon name="join-room" size={20} />
              <span>{JoinRoomBtnText}</span>
            </PublicFormSubmitButton>
          </form>
    </PublicModalForm>
  );
  return (
    <Modal
      open={joinRoomModalOpen !== null}
      closeModal={handleClose}
      modalHeader={<PublicModalHeader title={JoinRoomBtnText} icon="join-room" tone="green" onClose={handleClose} closeLabel="Close join room" />}
      modalContent={loading ? <LoadingState label={LoadingText} className="min-h-64 border-white/20 bg-white/10" /> : (!isAuthenticated ? renderAuthRequired() : renderModalContent())}
    />
  )
}
