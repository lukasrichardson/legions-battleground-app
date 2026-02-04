import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { setJoinRoomModalOpen } from "@/client/redux/modalsSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { useAuth } from "@/client/hooks/useAuth";
import { signIn } from "next-auth/react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/client/ui/select";
import { fetchDecks } from "@/client/utils/api.utils";

const ModalConstants = {
  LoadingText: "Loading...",
  RoomNameLabelText: "Room Name",
  YourNameLabelText: "Your Name",
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
  const [decks, setDecks] = useState<{name: string, _id: string}[]>([]);

  const {
    LoadingText,
    RoomNameLabelText,
    YourNameLabelText,
    JoinRoomBtnText,
    RoomPasswordLabelText,
    DeckLabelText
  } = ModalConstants;

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
        playerName,
        deckId,
        roomPassword
      });
      const { roomName: newRoomName } = res.data;
      router.push(`/play?room=${newRoomName}&playerName=${playerName}&deckId=${deckId}${roomPassword ? `&roomPassword=${roomPassword}` : ""}`);
      dispatch(setJoinRoomModalOpen(null));
      setPlayerName("");
      setRoomPassword("");
      setDeckId("");
      setError("");
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

  const getDecks = async () => {
      fetchDecks((param: {name: string, _id: string}[]) => {setDecks(param)});
    }
  
  useEffect(() => {
    getDecks();
  }, [])

  const renderAuthRequired = () => (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4 shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
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

  const renderLoading = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3 text-white">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg">{LoadingText}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const handleDeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== deckId) {
      setDeckId(selectedId);
    }
  }

  const renderModalContent = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
        <CardContent className="p-8">
          <form onSubmit={handleJoinRoom} className="space-y-6">
            {/* Room Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                {RoomNameLabelText}
              </label>
              <Input
                type="text"
                value={joinRoomModalOpen}
                disabled={true}
                name="roomName"
                className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 px-4 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Grid Layout for Name and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  {YourNameLabelText}
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  name="playerName"
                  autoComplete="on"
                  placeholder="Enter your name"
                  className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 px-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                  required
                />
              </div>

              {/* Room Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  {RoomPasswordLabelText}
                </label>
                <Input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 px-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
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
                    <SelectLabel>Your Decks</SelectLabel>
                    {decks.map((deckOption, index) => (
                      <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                        {deckOption.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-4">
                <div className="text-red-300 text-sm font-medium">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining Room...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>{JoinRoomBtnText}</span>
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
      open={joinRoomModalOpen !== null}
      closeModal={() => {
        dispatch(setJoinRoomModalOpen(null));
        setPlayerName("");
        setRoomPassword("");
        setDeckId("");
        setError("");
        setLoading(false);
      }}
      modalHeader={
        <div className="flex items-center justify-between w-full p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">{JoinRoomBtnText}</span>
          </div>
          <button
            onClick={() => dispatch(setJoinRoomModalOpen(null))}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
      modalContent={loading ? renderLoading() : (!isAuthenticated ? renderAuthRequired() : renderModalContent())}
    />
  )
}