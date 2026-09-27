import { describe, expect, it, vi } from "vitest";
import { createDeckPatchQueue } from "@/client/utils/deckPatchQueue";
import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";

const addCard = (id: string): DeckPatchOperation[] => [{ op: "add", path: "/cards_in_deck/-", value: id }];

describe("createDeckPatchQueue", () => {
  it("sends edits in order and never overlaps requests", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstRequest = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const send = vi.fn()
      .mockImplementationOnce(async () => firstRequest)
      .mockResolvedValueOnce(undefined);
    const queue = createDeckPatchQueue(send, vi.fn());

    queue.enqueue(addCard("first"));
    queue.enqueue(addCard("second"));
    expect(send).toHaveBeenCalledTimes(1);

    releaseFirst?.();
    await queue.whenIdle();

    expect(send).toHaveBeenNthCalledWith(1, addCard("first"));
    expect(send).toHaveBeenNthCalledWith(2, addCard("second"));
  });

  it("stops queued edits after a failed request", async () => {
    const failure = new Error("Deck is invalid");
    const send = vi.fn().mockRejectedValue(failure);
    const onError = vi.fn();
    const queue = createDeckPatchQueue(send, onError);

    queue.enqueue(addCard("first"));
    queue.enqueue(addCard("second"));
    await queue.whenIdle();

    expect(send).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
