"use-client";
import { setState } from "../redux/gameStateSlice";
import { setSide } from "../redux/clientGameStateSlice";
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
}

export const useSocket = () => {
  const [rooms, setRooms] = useState({});
  const [room, setRoom] = useState<{ id: string, players: [], sandboxMode: boolean, password: string }>({ id: "", players: [], sandboxMode: true, password: "" });
  const [joinedGame, setJoinedGame] = useState(false);
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const roomName = params.get("room");
  const playerName = params.get("playerName");
  const deckId = params.get("deckId");
  const p2DeckId = params.get("p2DeckId");
  const router = useRouter();
  const pathname = usePathname();

  const handleGameEvent = (payload) => {
    dispatch(setState(payload.data))
    dispatch(setSequenceState({
      sequences: payload.data.sequences,
      resolving: payload.data.resolving,
    }))
  }
  const handleRooms = (payload) => {
    setRooms(payload);
    if (roomName && payload?.[roomName]) {
      if (
        room.id !== payload[roomName].id ||
        room.players !== payload[roomName].players ||
        room.sandboxMode !== payload[roomName].sandboxMode ||
        room.password !== payload[roomName].password
      ) {
        setRoom(payload[roomName]);
      }
    }
  }
  const handlePhaseEvent = (payload) => {
    dispatch(setPhaseState(payload.data));
  }

  const handleRoomEvent = useCallback((payload) => {
    const p1 = payload?.players?.[socket.id]?.p1;
    dispatch(setSide(p1 ? "p1" : "p2"));
  }, [dispatch])

  useEffect(() => {
    socket.on(SOCKET_PAYLOAD_TYPE.gameEvent, handleGameEvent)
    socket.on(SOCKET_PAYLOAD_TYPE.phaseEvent, handlePhaseEvent)
    socket.on(SOCKET_PAYLOAD_TYPE.rooms, handleRooms)
    socket.on(SOCKET_PAYLOAD_TYPE.roomEvent, handleRoomEvent)
    if (!socket.connected) socket.connect();

    return () => {
      socket.off(SOCKET_PAYLOAD_TYPE.gameEvent, handleGameEvent)
      socket.off(SOCKET_PAYLOAD_TYPE.phaseEvent, handlePhaseEvent)
      socket.off(SOCKET_PAYLOAD_TYPE.rooms, handleRooms)
      socket.off(SOCKET_PAYLOAD_TYPE.roomEvent, handleRoomEvent)
      if (socket.connected) socket.disconnect();
    }
  }, []);

  useEffect(() => {
    if (pathname === "/play") {
      if (!roomName || !playerName || !deckId) router.push("/");
      if (!joinedGame) {
        setJoinedGame(true);
        socket.emit("joinGame", { roomName, playerName, deckId, p2DeckId })
      };
    }
  }, [roomName, playerName, deckId, p2DeckId, pathname, router, joinedGame])
  return { socket, rooms, room };
}