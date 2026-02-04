"use client";
import { Suspense } from 'react'
import CreateRoomModal from "./components/Modals/CreateRoomModal";
import JoinRoomModal from "./components/Modals/JoinRoomModal";
import Home from "./Home";
import HelpModal from "./components/Modals/HelpModal";
import PreviewDeckModal from "./components/Modals/PreviewDeckModal";
import { SessionProvider } from 'next-auth/react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

function Page() {
  const router = useRouter();
  
  return (
    <div>
      <SessionProvider>
        <DndProvider backend={HTML5Backend}>
        <main className={"relative flex flex-col justify-center items-center h-screen w-screen"}>
          <Home />
          {process.env.NODE_ENV === "development" && <div className='dev-tools fixed flex flex-col left-0 top-0 bg-white'>
            <button
              onClick={async () => {
                //create test game quickly
                try {
                  const res = await axios.post(`${window.location.origin}/createRoom`, {
                    roomName: 'Restingtoom123',
                    playerName: 'Test Player',
                    sandboxMode: true,
                    // deckId: "68d414053a94febdaeab0678",
                    deckId: "6979221e821f116643a62def",
                    roomPassword: ""
                  });
                  const { roomName: newRoomName } = res.data;
                  // router.push(`/play?room=${newRoomName}&playerName=Testingroom123&deckId=68d414053a94febdaeab0678`);
                  router.push(`/play?room=${newRoomName}&playerName=Testingroom123&deckId=6979221e821f116643a62def`);
                } catch (error) {
                  console.log('Error creating test game:', error);
                  alert(" U R FAIL");
                }
              }}
            >
              Create Test Game
            </button>
          </div>}
          <CreateRoomModal />
          <JoinRoomModal />
          <HelpModal />
          <PreviewDeckModal />

        </main>
        </DndProvider>
      </SessionProvider>
    </div>
  );
}

export default function BasePage() {
  return (<Suspense>
    <Page />
  </Suspense>)
}
