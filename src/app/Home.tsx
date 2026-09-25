import { useSocket } from "@/client/hooks/useSocket";
import { closeHelpModal, openImportDeckModal } from "@/client/redux/modalsSlice";
import { useAppDispatch } from "@/client/redux/hooks";
import { setCreateRoomModalOpen, setJoinRoomModalOpen } from "@/client/redux/modalsSlice";
import { ReactElement, useEffect, useState } from "react";
import Table from "./components/Table/Table";
import { Button } from "@/client/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/ui/card";
import { useSession } from "next-auth/react";
import AuthButtons from "./components/auth/AuthButtons";
import { useRouter } from "next/navigation";
import FullPage from "./components/FullPage";
import PerformanceDashboard from "./components/Modals/PerformanceDashboard";
import useBackgroundPreload from "@/client/hooks/useBackgroundPreload";
import useIsMobile from "@/client/hooks/useIsMobile";
import Image from "next/image";
import RecentPublishedDecksPanel from "./components/RecentPublishedDecksPanel";

const HomeConstants = {
  HomeTitle: "Legions Battleground",
  HomeDescription: "Play and Practice LRAW Online -",
  CreateGameBtnText: "Play",
  RoomsHeaderText: "Game Rooms",
  JoinBtnText: "Join",
  ImportDeckText: "Import Deck",
  BrowseDecksText: "Browse Decks"
}

const renderQuickActionCard = ({
  title,
  description,
  icon,
  onClick
}: {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick: () => void;
}) => (
  <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer" onClick={onClick}>
    <CardHeader className="p-4">
      <CardTitle className="flex justify-center items-center gap-2 text-lg">
        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        {title}
      </CardTitle>
      <CardDescription className="text-gray-300 text-sm text-center">
        {description}
      </CardDescription>
    </CardHeader>
  </Card>
)

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
            <span className="text-green-500">Powered By <a className="!underline" href="https://api.legionstoolbox.com" target="_blank" rel="noopener noreferrer">LegionsToolbox.com</a></span>
            </p>
          </div>

          {sessionStatus !== "loading" && !session && (
            <section className="mx-auto flex w-full max-w-4xl flex-col grow overflow-y-hidden items-center gap-6 text-center">
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                {renderQuickActionCard({
                  title: "Card Gallery",
                  description: "Search & Filter all cards",
                  icon: <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2m0 0V5a2 2 0 00-2-2h-6a2 2 0 00-2 2v2M7 7h10" />
                    </svg>
                  </div>,
                  onClick: handleCardsClick,
                })}
                {renderQuickActionCard({
                  title: BrowseDecksText,
                  description: "Browse published decklists",
                  icon: <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2m0 0V5a2 2 0 00-2-2h-6a2 2 0 00-2 2v2M7 7h10" />
                    </svg>
                  </div>,
                  onClick: handleBrowseDecksClick,
                })}
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
              <div className="grow overflow-y-hidden w-full max-w-2xl">
                <RecentPublishedDecksPanel />
              </div>
            </section>
          )}

          {session &&<>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 max-w-6xl mx-auto w-full">
              {renderQuickActionCard({
                title: "Decks",
                description: "Create and edit your decks",
                icon: <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>,
                onClick: handleDecksClick
              })}
              {renderQuickActionCard({
                title: "Card Gallery",
                description: "Search & Filter all cards",
                icon: <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>,
                onClick: handleCardsClick
              })}
              {!isMobile && (
                renderQuickActionCard({
                  title: CreateGameBtnText,
                  description: "Create a VS or Solo game",
                  icon: <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>,
                  onClick: handleCreateGame
                })
              )}
              {renderQuickActionCard({
                title: ImportDeckText,
                description: "Import a deck from Toolbox",
                icon: <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>,
                onClick: handleImportDeck
              })}
              {renderQuickActionCard({
                title: BrowseDecksText,
                description: "Browse published decklists",
                icon: <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>,
                onClick: handleBrowseDecksClick
              })}
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
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-base">No active game rooms</p>
                      <p className="text-gray-500 text-sm mt-1">Create a new game to get started!</p>
                    </div>
                  ) : (
                    <div className="h-full overflow-x-auto overflow-y-auto">
                      <Table
                        className="min-w-[640px]"
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
                className="bg-purple-600 hover:bg-purple-700 text-xs"
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
