"use client";
import { setState } from "../redux/gameStateSlice";
import { setSide, setRoom as setRoomRedux, setHistoryState } from "../redux/clientGameStateSlice";
import { useAppDispatch } from "../redux/hooks";
import { socket } from "../socket";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { setPhaseState } from "@/client/redux/phaseSlice";
import { setState as setSequenceState } from "@/client/redux/sequenceSlice";

export enum SOCKET_PAYLOAD_TYPE {
  gameEvent = "gameEvent",
  phaseEvent = "phaseEvent",
  roomEvent = "roomEvent",
  rooms = "rooms",
  "joinedGame" = "joinedGame",
  gameHistoryEvent = "gameHistoryEvent"
}

export const useSocket = () => {
  const [rooms, setRooms] = useState({});
  const [room, setRoom] = useState<{ id: string, players: [], sandboxMode: boolean, requiresPassword: boolean }>({ id: "", players: [], sandboxMode: true, requiresPassword: false });
  const [joinedGame, setJoinedGame] = useState(false);
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const roomName = params.get("room");
  const playerName = params.get("playerName");
  const deckId = params.get("deckId");
  const p2DeckId = params.get("p2DeckId");
  const router = useRouter();
  const pathname = usePathname();

  const handleGameEvent = useCallback((payload) => {
    dispatch(setState(payload.data))
    dispatch(setSequenceState({
      sequences: payload.data.sequences,
      resolving: payload.data.resolving,
    }))
  }, [dispatch]);

  const handleRooms = useCallback((payload) => {
    setRooms(payload);
    if (roomName && payload?.[roomName]) {
      setRoom((currentRoom) => {
        const nextRoom = payload[roomName];
        const hasChanged =
          currentRoom.id !== nextRoom.id ||
          currentRoom.players !== nextRoom.players ||
          currentRoom.sandboxMode !== nextRoom.sandboxMode ||
          currentRoom.requiresPassword !== nextRoom.requiresPassword;

        if (hasChanged) dispatch(setRoomRedux(nextRoom));
        return hasChanged ? nextRoom : currentRoom;
      });
    }
  }, [dispatch, roomName]);

  const handlePhaseEvent = useCallback((payload) => {
    dispatch(setPhaseState(payload.data));
  }, [dispatch]);

  const handleRoomEvent = useCallback((payload) => {
    console.log("Received room event:", payload);
    dispatch(setRoomRedux(payload));
    const p1 = payload?.players?.[socket.id]?.p1;
    dispatch(setSide(p1 ? "p1" : "p2"));
  }, [dispatch])

  const handleHistoryEvent = useCallback((payload) => {
    dispatch(setHistoryState({
      gameHistory: payload.gameHistory,
      undoneHistory: payload.undoneHistory,
    }))
  }, [dispatch])

  useEffect(() => {
    socket.on(SOCKET_PAYLOAD_TYPE.gameEvent, handleGameEvent)
    socket.on(SOCKET_PAYLOAD_TYPE.phaseEvent, handlePhaseEvent)
    socket.on(SOCKET_PAYLOAD_TYPE.rooms, handleRooms)
    socket.on(SOCKET_PAYLOAD_TYPE.roomEvent, handleRoomEvent)
    socket.on(SOCKET_PAYLOAD_TYPE.gameHistoryEvent, handleHistoryEvent);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off(SOCKET_PAYLOAD_TYPE.gameEvent, handleGameEvent)
      socket.off(SOCKET_PAYLOAD_TYPE.phaseEvent, handlePhaseEvent)
      socket.off(SOCKET_PAYLOAD_TYPE.rooms, handleRooms)
      socket.off(SOCKET_PAYLOAD_TYPE.roomEvent, handleRoomEvent)
      socket.off(SOCKET_PAYLOAD_TYPE.gameHistoryEvent, handleHistoryEvent);
      if (socket.connected) socket.disconnect();
    }
  }, [handleGameEvent, handleHistoryEvent, handlePhaseEvent, handleRoomEvent, handleRooms]);

  useEffect(() => {
    if (pathname === "/play") {
      if (!roomName || !playerName || !deckId) router.push("/");
      if (!joinedGame) {
        setJoinedGame(true);
        const roomPassword = window.sessionStorage.getItem(`roomPassword:${roomName}`) ?? undefined;
        socket.emit("joinGame", { roomName, playerName, deckId, p2DeckId, roomPassword })
      };
    }
  }, [roomName, playerName, deckId, p2DeckId, pathname, router, joinedGame])
  return { socket, rooms, room };
}
