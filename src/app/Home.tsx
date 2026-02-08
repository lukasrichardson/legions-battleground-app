import { useSocket } from "@/client/hooks/useSocket";
import { closeHelpModal, openImportDeckModal } from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import { setCreateRoomModalOpen, setJoinRoomModalOpen } from "@/client/redux/modalsSlice";
import { ReactElement, useEffect } from "react";
import Table from "./components/Table/Table";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/ui/card";
import { useSession } from "next-auth/react";
import AuthButtons from "./components/auth/AuthButtons";
import { useRouter } from "next/navigation";
import { fetchCards } from "@/client/utils/api.utils";
import { preloadAllCardsBackground } from "@/client/utils/imagePreloader";
import FullPage from "./components/FullPage";

const HomeConstants = {
  HomeTitle: "Legions Battleground",
  HomeDescription: "Play and Practice LRAW Online -",
  CreateGameBtnText: "Play",
  RoomsHeaderText: "Game Rooms",
  JoinBtnText: "Join",
  ImportDeckText: "Import Deck",
}

export default function Home() {
  const dispatch = useAppDispatch();
  const { rooms } = useSocket();
  const router = useRouter();

  const {data: session} = useSession();

  const handleCreateGame = () => {
    dispatch(setCreateRoomModalOpen(true));
  }

  const handleJoinRoomClick = (roomId: string) => {
    dispatch(setJoinRoomModalOpen(roomId));
  }

  const handleImportDeck = () => {
    dispatch(openImportDeckModal());
  }

  useEffect(() => {
    dispatch(closeHelpModal());
  }, [dispatch])

  // Start background preloading of all card images after page load
  useEffect(() => {
    const startBackgroundPreload = async () => {
      try {
        console.log('[Home] Starting background preload of all cards');
        const res = await fetchCards({ page: 1, pageSize: 100 }); // Smaller batch to respect API
        if (res?.cards?.length) {
          console.log(`[Home] Found ${res.cards.length} cards for background preloading`);
          preloadAllCardsBackground(res.cards);
        }
      } catch (error) {
        console.warn('[Home] Background preload failed:', error);
      }
    };

    // Start preloading after a short delay
    const timer = setTimeout(startBackgroundPreload, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDecksClick = () => {
    router.push("decks");
  }

  const handleCardsClick = () => {
    router.push("cards");
  }

  const {
    HomeTitle,
    HomeDescription,
    CreateGameBtnText,
    RoomsHeaderText,
    JoinBtnText,
    ImportDeckText
  } = HomeConstants;
  
  return (
    <FullPage>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              {HomeTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              {HomeDescription}{"   "}
            <span className="text-green-500">Powered By <a className="!underline" href="https://legionstoolbox.com" target="_blank" rel="noopener noreferrer">Legions Toolbox</a></span>
            </p>
            <AuthButtons />
          </div>

          {session &&<>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-6xl mx-auto w-full">
              <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleDecksClick}>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    {"Decks"}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Create and edit your decks
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleCardsClick}>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    {"Card Gallery"}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Search & Filter through all cards
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleCreateGame}>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    {CreateGameBtnText}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Create a VS or Solo game
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={handleImportDeck}>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    {ImportDeckText}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Import a deck from Toolbox
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Game Rooms */}
            <div className="flex-1 min-h-0">
              <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                      {RoomsHeaderText}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Object.values(rooms).length} active rooms
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 overflow-hidden">
                  {Object.values(rooms).length === 0 ? (
                    <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-base">No active game rooms</p>
                      <p className="text-gray-500 text-sm mt-1">Create a new game to get started!</p>
                    </div>
                  ) : (
                    <div className="h-full overflow-auto">
                      <Table
                        tableHeaders={["Room Name", "Players", "Sandbox Mode", "Password", "Action"]}
                        tableData={(Object.values(rooms) as {id: string, players: object, sandboxMode: boolean, password: string}[]).map((room: {id: string, players: object, sandboxMode: boolean, password: string}) => [
                          <div className="flex items-center gap-2" key={room.id}>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="font-medium text-sm">{room.id}</span>
                          </div>,
                          <div className="flex items-center gap-2" key={room.id}>
                            <span className="font-medium">{Object.values(room.players).length}</span>
                            <span className="text-gray-400 text-sm">players</span>
                          </div>,
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            room.sandboxMode 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`} key={room.id}>
                            {room.sandboxMode ? "Yes" : "No"}
                          </span>,
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            room.password 
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`} key={room.id}>
                            {room.password ? "Yes" : "No"}
                          </span>,
                          <Button 
                            onClick={() => handleJoinRoomClick(room.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                            key={room.id}
                          >
                            {JoinBtnText}
                          </Button>
                        ]) as (ReactElement | string)[][]}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>}
    </FullPage>
  )
}