"use-client";
import { setState } from "../redux/gameStateSlice";
import { setSide, setRoom as setRoomRedux, setHistoryState } from "../redux/clientGameStateSlice";
import { useAppDispatch } from "../redux/hooks";
import { socket } from "../socket";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { setPhaseState } from "@/client/redux/phaseSlice";
import { setState as setSequenceState } from "@/client/redux/sequenceSlice";
import { PublicRoomsCollection, RoomStateForMembers } from "@/shared/interfaces/RoomInterface";

export enum SOCKET_PAYLOAD_TYPE {
  gameEvent = "gameEvent",
  phaseEvent = "phaseEvent",
  roomEvent = "roomEvent",
  rooms = "rooms",
  "joinedGame" = "joinedGame",
  gameHistoryEvent = "gameHistoryEvent"
}

export const useSocket = () => {
  const [rooms, setRooms] = useState<PublicRoomsCollection>({});
  const [joinedGame, setJoinedGame] = useState(false);
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const roomName = params.get("room");
  const playerName = params.get("playerName");
  const deckId = params.get("deckId");
  const router = useRouter();
  const pathname = usePathname();

  const handleGameEvent = (payload) => {
    dispatch(setState(payload.data))
    dispatch(setSequenceState({
      sequences: payload.data.sequences,
      resolving: payload.data.resolving,
    }))
  }
  const handleRooms = (payload: PublicRoomsCollection) => {
    setRooms(payload);
  }
  const handlePhaseEvent = (payload) => {
    dispatch(setPhaseState(payload.data));
  }

  const handleRoomEvent = useCallback((payload: RoomStateForMembers) => {
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
    // Keep one socket subscription for this hook's lifetime; changing handlers
    // must not disconnect and reconnect an active game session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname === "/play") {
      if (!roomName || !playerName || !deckId) {
        router.push("/");
        return;
      }

      const joinGame = () => {
        if (joinedGame) return;
        setJoinedGame(true);
        socket.emit("joinGame", {});
      };

      if (socket.connected) joinGame();
      else socket.once("connect", joinGame);

      return () => { socket.off("connect", joinGame); };
    }
  }, [roomName, playerName, deckId, pathname, router, joinedGame])
  return { socket, rooms };
}
