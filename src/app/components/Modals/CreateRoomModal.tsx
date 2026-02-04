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
import { fetchDecks } from "@/client/utils/api.utils";
import { useAuth } from "@/client/hooks/useAuth";

const ModalConstants = {
  LoadingText: "Creating your game...",
  RoomNameLabelText: "Room Name",
  YourNameLabelText: "Your Name",
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
  const [decks, setDecks] = useState<{name: string, _id: string}[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    LoadingText,
    RoomNameLabelText,
    YourNameLabelText,
    DeckLabelText,
    SandboxModeLabelText,
    CreateGameBtnText,
    RoomPasswordLabelText,
    CreateGameDescription,
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
        playerName,
        sandboxMode,
        deckId,
        roomPassword
      });
      const { roomName: newRoomName } = res.data;
      router.push(`/play?room=${newRoomName}&playerName=${playerName}&deckId=${deckId}${roomPassword ? `&roomPassword=${roomPassword}` : ""}`);
      setRoomName("");
      setPlayerName("");
      setSandboxMode(false);
      setDeckId("");
      setLoading(false);
      dispatch(setCreateRoomModalOpen(false));
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Error handled by UI feedback
        setError("Error: " + error.message || " An Error Occurred, try again");
      } else {
        setError("Error: " + error || " An Error Occurred, try again");
      }
      setLoading(false);
    }
  }

  // const handleCreateTestGame = async (e: React.MouseEvent<HTMLDivElement>) => {
  //   e.preventDefault();
    
  //   // Check authentication before proceeding
  //   if (!isAuthenticated) {
  //     setError("Please sign in to create a test room");
  //     return;
  //   }
    
  //   setLoading(true);
  //   try {
  //     const res = await axios.post(`${window.location.origin}/createRoom`, {
  //       roomName: "testroom",
  //       playerName: "testplayer",
  //       sandboxMode: true,
  //       deckId: "68d414053a94febdaeab0678",
  //       roomPassword: ""
  //     });
  //     const { roomName: newRoomName } = res.data;
  //     router.push(`/play?room=${newRoomName}&playerName=testplayer&deckId=68d414053a94febdaeab0678`);
  //     setRoomName("");
  //     setPlayerName("");
  //     setSandboxMode(true);
  //     setDeckId("");
  //     setLoading(false);
  //     dispatch(setCreateRoomModalOpen(false));
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
        // Error would be handled here
  //       setError("Error: " + error.message || " An Error Occurred, try again");
  //     } else {
  //       setError("Error: " + error || " An Error Occurred, try again");
  //     }
  //     setLoading(false);
  //   }
  // }

  const getDecks = async () => {
    fetchDecks((param: {name: string, _id: string}[]) => {setDecks(param)});
  }

  useEffect(() => {
    getDecks();
  }, [])

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
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  );

  const handleDeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== deckId) {
      setDeckId(selectedId);
    }
  }

  const renderModalContent = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <p className="text-gray-300 text-base max-w-md mx-auto leading-relaxed">{CreateGameDescription}</p>
      </div>

      {/* Form Card */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleCreateRoom} className="space-y-6">
            {/* Form Grid */}
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
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  name="playerName"
                  autoComplete="on"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-200"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Deck  Section */}
            <div className="space-y-3">
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
                  disabled={process.env.NODE_ENV === "production"}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2 opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white">{SandboxModeLabelText}</label>
                <p className="text-xs text-gray-400">Currently enabled for all games</p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
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
        setPlayerName("");
        setSandboxMode(true);
        setDeckId("");
        setLoading(false);
      }}
      modalHeader={
        <div className="flex items-center justify-between w-full p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">{CreateGameBtnText}</span>
          </div>
          <button
            onClick={() => dispatch(setCreateRoomModalOpen(false))}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
      modalContent={loading ? renderLoading() : renderModalContent()}
    />
  )
}