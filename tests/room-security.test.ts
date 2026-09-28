import { describe, expect, it, vi } from "vitest";
import { clearExpiredAdmissionGrants, issueAdmissionGrant, resolveAdmissionGrant } from "@/server/network/roomAdmissionTicket";
import { RoomService } from "@/server/services/game/RoomService";
import { hashRoomPassword, matchesRoomPassword } from "@/server/services/game/roomPassword";
import { handleSocketJoinGame } from "@/server/utils/socket.util.clean";

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
});

describe("room admission grants", () => {
  it("accepts only a currently issued grant", () => {
    const token = issueAdmissionGrant({ roomId: "room", playerName: "Alias", deckId: "deck" });

    expect(resolveAdmissionGrant(token)).toMatchObject({ roomId: "room", playerName: "Alias", deckId: "deck" });
    expect(resolveAdmissionGrant("forged-token")).toBeNull();

    clearExpiredAdmissionGrants(Number.MAX_SAFE_INTEGER);
    expect(resolveAdmissionGrant(token)).toBeNull();
  });
});
