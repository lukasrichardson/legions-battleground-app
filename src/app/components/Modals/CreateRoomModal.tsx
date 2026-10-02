import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { setCreateRoomModalOpen } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { Card, CardContent } from "@/client/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { useDeckPickerOptions } from "@/client/hooks/useDeckPickerOptions";
import { useAuth } from "@/client/hooks/useAuth";
import { refreshSocketConnection } from "@/client/socket";
import AppIcon from "../AppIcon";

const ModalConstants = {
  LoadingText: "Creating your game...",
  RoomNameLabelText: "Room Name",
  YourNameLabelText: "Battleground username",
  DeckLabelText: "Deck",
  SandboxModeLabelText: "Sandbox Mode",
  CreateGameBtnText: "Create New Game",
  RoomPasswordLabelText: "Room Password (Optional)",
  CreateGameDescription: "Set up a new game session and invite others to join",
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
  const { options: decks } = useDeckPickerOptions(Boolean(createRoomModalOpen && isAuthenticated));

  const {
    LoadingText,
    RoomNameLabelText,
    YourNameLabelText,
    DeckLabelText,
    SandboxModeLabelText,
    CreateGameBtnText,
    RoomPasswordLabelText,
  } = ModalConstants;

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
      setRoomName("");
      setPlayerName("");
      setSandboxMode(true);
      setDeckId("");
      setP2DeckId("");
      setRoomPassword("");
      dispatch(setCreateRoomModalOpen(false));
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Error handled by UI feedback
        setError("Error: " + error.message || " An Error Occurred, try again");
      } else {
        setError("Error: " + error || " An Error Occurred, try again");
      }
    } finally {
      setRoomPassword("");
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

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-white font-medium mt-6">{LoadingText}</p>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

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
    <div className="w-full max-w-2xl flex flex-col items-center">

      <Card className="bg-white/10 border-white/20 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Room Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white">
                  {RoomNameLabelText}
                </label>
                <Input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  name="roomName"
                  autoComplete="on"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-200"
                  placeholder="Enter room name"
                  required
                />
              </div>

              {/* Player Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white">
                  {YourNameLabelText}
                </label>
                <Input
                  type="text"
                  value={playerName || auth?.user?.name || ""}
                  readOnly
                  name="playerName"
                  autoComplete="on"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-200"
                />
              </div>
            </div>

            {/* Deck  Section */}
            <div className="space-y-3 flex justify-between flex-wrap">
              <div>
                <label className="block text-sm font-semibold text-white">
                  {DeckLabelText}
                </label>
                <Select value={deckId} onValueChange={handleDeckChange}>
                  <SelectTrigger className="h-6 w-32 text-xs bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select deck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {decks.map((deckOption, index) => (
                        <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                          {deckOption.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white">
                  P2 {DeckLabelText} (Optional)
                </label>
                <Select value={p2DeckId} onValueChange={handleP2DeckChange}>
                  <SelectTrigger className="h-6 w-32 text-xs bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select deck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {decks.map((deckOption, index) => (
                        <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                          {deckOption.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Room Password */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                {RoomPasswordLabelText}
              </label>
              <Input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-200"
                placeholder="Leave empty for no password"
              />
            </div>

            {/* Sandbox Mode */}
            <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="relative">
                <input
                  type="checkbox"
                  name="sandbox"
                  checked={sandboxMode}
                  onChange={onSandboxModeChange}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white">{SandboxModeLabelText}</label>
                <p className="text-xs text-gray-400">Enable free-form sandbox play, or disable it for a regular match.</p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AppIcon name="error" className="text-red-400 flex-shrink-0" size={20} />
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Game...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <AppIcon name="create" size={20} />
                  <span>{CreateGameBtnText}</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Modal
      open={createRoomModalOpen}
      closeModal={() => {
        dispatch(setCreateRoomModalOpen(false));
        setRoomName("");
        setSandboxMode(true);
        setDeckId("");
        setLoading(false);
      }}
      modalHeader={
        <div className="flex items-center justify-between max-w-2xl p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <AppIcon name="create" className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-white">{CreateGameBtnText}</span>
          </div>
          <button
            onClick={() => dispatch(setCreateRoomModalOpen(false))}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
          >
            <AppIcon name="close" size={24} />
          </button>
        </div>
      }
      modalContent={loading ? renderLoading() : renderModalContent()}
    />
  )
}
