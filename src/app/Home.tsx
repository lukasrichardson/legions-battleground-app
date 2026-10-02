import { useSocket } from "@/client/hooks/useSocket";
import { closeHelpModal, openImportDeckModal } from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import { setCreateRoomModalOpen, setJoinRoomModalOpen } from "@/client/redux/modalsSlice";
import { ReactElement, useEffect, useState } from "react";
import Table from "./components/Table/Table";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { useSession } from "next-auth/react";
import AuthButtons from "./components/auth/AuthButtons";
import { useRouter } from "next/navigation";
import FullPage from "./components/FullPage";
import PerformanceDashboard from "./components/Modals/PerformanceDashboard";
import useBackgroundPreload from "@/client/hooks/useBackgroundPreload";
import useIsMobile from "@/client/hooks/useIsMobile";
import Image from "next/image";
import RecentPublishedDecksPanel from "./components/RecentPublishedDecksPanel";
import AppIcon from "./components/AppIcon";
import ActionCard from "./components/ActionCard";

const HomeConstants = {
  HomeTitle: "Legions Battleground",
  HomeDescription: "Play and Practice LRAW Online -",
  CreateGameBtnText: "Play",
  RoomsHeaderText: "Game Rooms",
  JoinBtnText: "Join",
  ImportDeckText: "Import Deck",
  BrowseDecksText: "Browse Decks"
}

export default function Home() {
  const dispatch = useAppDispatch();
  const { rooms } = useSocket();
  const router = useRouter();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

  const {data: session, status: sessionStatus} = useSession();

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
  useBackgroundPreload();

  const handleDecksClick = () => {
    router.push("decks");
  }

  const handleCardsClick = () => {
    router.push("cards");
  }

  const handleBrowseDecksClick = () => {
    router.push("decks/browse");
  }

  const {
    HomeTitle,
    HomeDescription,
    CreateGameBtnText,
    RoomsHeaderText,
    JoinBtnText,
    ImportDeckText,
    BrowseDecksText
  } = HomeConstants;

  const isDev = process.env.NODE_ENV === "development";
  const isMobile = useIsMobile();
  return (
    <FullPage topRightContent={<AuthButtons />}>
          {/* Header */}
          <div className="text-center pt-12">
            <h1 className="hidden xs:block text-lg font-bold text-white">
              {HomeTitle}
            </h1>
            <Image
              src="/logo.svg"
              alt=""
              width={160}
              height={133}
              priority
              className="mx-auto h-auto w-32 sm:w-64 mb-2"
            />
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto mb-4">
              {HomeDescription}{"   "}
            <span className="text-green-500">Powered By <a className="!underline" href="https://legionstoolbox.com" target="_blank" rel="noopener noreferrer">LegionsToolbox.com</a></span>
            </p>
          </div>

          {sessionStatus !== "loading" && !session && (
            <section className="mx-auto flex w-full max-w-5xl flex-col grow overflow-y-hidden items-center gap-6 text-center">
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                <ActionCard title="Card Gallery" description="Search and filter every card" icon={<AppIcon name="card-gallery" size={18} />} iconClassName="bg-violet-500/20 text-violet-200" onClick={handleCardsClick} />
                <ActionCard title={BrowseDecksText} description="Browse published decklists" icon={<AppIcon name="browse" size={18} />} iconClassName="bg-pink-500/20 text-pink-200" onClick={handleBrowseDecksClick} />
              </div>

              <Card className="w-full max-w-2xl border-white/20 bg-slate-950/30 text-white">
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  <div>
                    <h3 className="font-semibold">Continue with your Google, Discord, or GitHub account.</h3>
                    <p className="mt-1 text-sm text-gray-300">Sign in to create decks, import decks, and create/join games</p>
                  </div>
                  <AuthButtons
                    signInLabel="Enter The Battleground"
                    signInClassName="bg-green-600 hover:bg-green-500 text-white"
                  />
                </CardContent>
              </Card>
              <div className="grow overflow-y-hidden w-full">
                <RecentPublishedDecksPanel />
              </div>
            </section>
          )}

          {session &&<>
            {/* Quick Actions */}
            <div className="grid xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-2 sm:mb-6 max-w-6xl mx-auto sm:w-full">
              <ActionCard title="Decks" description="Create and edit your decks" icon={<AppIcon name="decks" size={18} />} iconClassName="bg-blue-500/20 text-blue-200" onClick={handleDecksClick} />
              <ActionCard title="Card Gallery" description="Search and filter every card" icon={<AppIcon name="card-gallery" size={18} />} iconClassName="bg-violet-500/20 text-violet-200" onClick={handleCardsClick} />
              {!isMobile && (
                <ActionCard title={CreateGameBtnText} description="Create a VS or solo game" icon={<AppIcon name="create" size={18} />} iconClassName="bg-emerald-500/20 text-emerald-200" onClick={handleCreateGame} />
              )}
              <ActionCard title={ImportDeckText} description="Import a deck from Toolbox" icon={<AppIcon name="import" size={18} />} iconClassName="bg-orange-500/20 text-orange-200" onClick={handleImportDeck} />
              <ActionCard title={BrowseDecksText} description="Browse published decklists" icon={<AppIcon name="browse" size={18} />} iconClassName="bg-pink-500/20 text-pink-200" onClick={handleBrowseDecksClick} />
            </div>

            {/* Desktop and tablet community activity. Mobile intentionally keeps its existing layout. */}
            {!isMobile &&(<div className="grid flex-1 min-h-0 w-full grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] gap-4 xl:gap-6">
              {/* Game Rooms */}
              <div className="min-w-0 min-h-0">
                <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>
                        {RoomsHeaderText}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Object.values(rooms).length} active rooms
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1 min-w-0 overflow-hidden">
                    {Object.values(rooms).length === 0 ? (
                      <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                          <AppIcon name="card-gallery" className="text-gray-400" size={24} />
                        </div>
                        <p className="text-gray-400 text-base">No active game rooms</p>
                        <p className="text-gray-500 text-sm mt-1">Create a new game to get started!</p>
                      </div>
                    ) : (
                      <div className="h-full overflow-x-auto overflow-y-auto">
                        <Table
                          className="min-w-[640px]"
                          tableHeaders={["Room Name", "Host", "Players", "Sandbox Mode", "Password", "Action"]}
                          tableData={Object.values(rooms).map((room) => [
                            <div className="flex items-center gap-2" key={room.id}>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="font-medium text-sm">{room.id}</span>
                            </div>,
                            <div className="flex items-center gap-2" key={room.id}>
                              <span className="font-medium">{room.hostName || "Player"}</span>
                            </div>,
                            <div className="flex items-center gap-2" key={room.id}>
                              <span className="font-medium">{room.playerCount}</span>
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
                              room.isLocked
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`} key={room.id}>
                              {room.isLocked ? "Yes" : "No"}
                            </span>,
                            <Button 
                              onClick={() => handleJoinRoomClick(room.id)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs text-white"
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
              <RecentPublishedDecksPanel />
            </div>)}
            {isMobile && (
              <div className="grow overflow-y-hidden w-full max-w-2xl mx-auto">
                <RecentPublishedDecksPanel />
              </div>
            )}
            
            {/* Performance Dashboard Button */}
            {isDev &&(<div className="mt-4 flex justify-center">
              <Button
                onClick={() => setShowPerformanceDashboard(true)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-xs text-white"
              >
                📊 Image Performance
              </Button>
            </div>)}
            
          </>}
          
          {/* Performance Dashboard Modal */}
          {process.env.NODE_ENV === "development" && (
            <PerformanceDashboard 
              isOpen={showPerformanceDashboard}
              onClose={() => setShowPerformanceDashboard(false)}
            />
          )}
    </FullPage>
  )
}
