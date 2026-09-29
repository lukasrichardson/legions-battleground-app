import { describe, expect, it, vi } from "vitest";
import { clearExpiredAdmissionGrants, issueAdmissionGrant, resolveAdmissionGrant } from "@/server/network/roomAdmissionTicket";
import { RoomService } from "@/server/services/game/RoomService";
import { hashRoomPassword, matchesRoomPassword } from "@/server/services/game/roomPassword";
import { handleSocketJoinGame } from "@/server/utils/socket.util.clean";
import { rooms } from "@/server/network/roomRegistry";
import { games } from "@/server/game/game";

describe("room password handling", () => {
  it("uses salted hashes and matches the exact submitted password", async () => {
    const first = await hashRoomPassword(" secret ");
    const second = await hashRoomPassword(" secret ");

    expect(first).not.toContain(" secret ");
    expect(first).not.toBe(second);
    await expect(matchesRoomPassword(first, " secret ")).resolves.toBe(true);
    await expect(matchesRoomPassword(first, "secret")).resolves.toBe(false);
    await expect(matchesRoomPassword("invalid", " secret ")).resolves.toBe(false);
  });
});

describe("public room views", () => {
  it("does not serialize secrets or socket identifiers", () => {
    const roomService = new RoomService();
    const publicRoom = roomService.toPublicRoom({
      id: "locked-room",
      sandboxMode: true,
      passwordHash: "v1:salt:private-derived-key",
      players: {
        socketA: { id: "socketA", name: "Host", p1: true },
        socketB: { id: "socketB", name: "Guest", p1: false },
      },
    });

    expect(publicRoom).toEqual({
      id: "locked-room",
      hostName: "Host",
      playerCount: 2,
      sandboxMode: true,
      isLocked: true,
    });
    expect(JSON.stringify(publicRoom)).not.toContain("password");
    expect(JSON.stringify(publicRoom)).not.toContain("socketA");
  });

  it("does not create a missing room when a player joins", () => {
    const roomService = new RoomService();
    expect(roomService.joinRoom("missing-room", { id: "socket", name: "Player" })).toEqual({ success: false });
    expect(roomService.getRoom("missing-room")).toBeNull();
  });
});

describe("socket room entry", () => {
  it("rejects joining without an admission cookie", async () => {
    const socket = {
      handshake: { headers: {} },
      emit: vi.fn(),
    };

    await handleSocketJoinGame({} as never, socket as never);

    expect(socket.emit).toHaveBeenCalledWith("error", {
      message: "Join authorization expired. Return to the lobby and join again.",
    });
  });

  it("accepts a freshly issued admission token from the Socket.IO handshake", async () => {
    const service = new RoomService();
    await service.createRoom("handshake-token-room", { sandboxMode: false });
    const token = issueAdmissionGrant({ roomId: "handshake-token-room", userId: "user", playerName: "Player", deckId: "deck" });
    const roomEmitter = { emit: vi.fn() };
    const io = { emit: vi.fn(), to: vi.fn(() => roomEmitter) };
    const socket = {
      id: "socket",
      handshake: { headers: {}, auth: { admissionToken: token } },
      emit: vi.fn(),
      join: vi.fn(),
    };

    await handleSocketJoinGame(io as never, socket as never);

    expect(socket.join).toHaveBeenCalledWith("handshake-token-room");
    expect(roomEmitter.emit).toHaveBeenCalledWith("gameEvent", expect.objectContaining({ data: expect.objectContaining({ sandboxMode: false }) }));
    delete rooms["handshake-token-room"];
    delete games["handshake-token-room"];
  });
});

describe("room admission grants", () => {
  it("accepts only a currently issued grant", () => {
    const token = issueAdmissionGrant({ roomId: "room", userId: "user", playerName: "Alias", deckId: "deck" });

    expect(resolveAdmissionGrant(token)).toMatchObject({ roomId: "room", userId: "user", playerName: "Alias", deckId: "deck" });
    expect(resolveAdmissionGrant("forged-token")).toBeNull();

    clearExpiredAdmissionGrants(Number.MAX_SAFE_INTEGER);
    expect(resolveAdmissionGrant(token)).toBeNull();
  });
});

describe("regular room seats", () => {
  it("restores a disconnected seat only to its original user and cleans up with no opponent", async () => {
    const service = new RoomService();
    await service.createRoom("regular-seat-test", { sandboxMode: false });
    const first = { roomId: "regular-seat-test", userId: "first", playerName: "First", deckId: "deck-1", expiresAt: 0 };
    const second = { roomId: "regular-seat-test", userId: "second", playerName: "Second", deckId: "deck-2", expiresAt: 0 };
    expect(service.joinOrResumeRegularRoom("regular-seat-test", first, "socket-1")).toBe("p1");
    expect(service.joinOrResumeRegularRoom("regular-seat-test", second, "socket-2")).toBe("p2");
    service.markRegularSeatDisconnected("regular-seat-test", "socket-1");
    expect(() => service.joinOrResumeRegularRoom("regular-seat-test", { ...second, userId: "third" }, "socket-3")).toThrow("Room is full");
    expect(service.joinOrResumeRegularRoom("regular-seat-test", first, "socket-4")).toBe("p1");
    service.markRegularSeatDisconnected("regular-seat-test", "socket-4");
    service.markRegularSeatDisconnected("regular-seat-test", "socket-2");
    expect(service.hasConnectedRegularOpponent("regular-seat-test")).toBe(false);
    service.removeRoom("regular-seat-test");
    expect(rooms["regular-seat-test"]).toBeUndefined();
  });
});
