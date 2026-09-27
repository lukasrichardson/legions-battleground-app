import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";

type QueuedPatch<T, TRequest> = {
  request: TRequest;
  onSuccess?: (result: T) => void;
};

/** Serializes deck saves so each patch is applied to the result of the previous one. */
export const createDeckPatchQueue = <T, TRequest = DeckPatchOperation[]>(
  send: (request: TRequest) => Promise<T>,
  onError: (error: unknown) => void,
) => {
  const pending: QueuedPatch<T, TRequest>[] = [];
  const idleResolvers: Array<() => void> = [];
  let sending = false;

  const resolveIdle = () => {
    if (sending || pending.length) return;
    idleResolvers.splice(0).forEach((resolve) => resolve());
  };

  const drain = async () => {
    if (sending) return;
    sending = true;
    while (pending.length) {
      const next = pending.shift()!;
      try {
        const result = await send(next.request);
        next.onSuccess?.(result);
      } catch (error) {
        pending.splice(0);
        onError(error);
      }
    }
    sending = false;
    resolveIdle();
  };

  return {
    enqueue(request: TRequest, onSuccess?: (result: T) => void) {
      pending.push({ request, onSuccess });
      void drain();
    },
    hasPending(): boolean {
      return pending.length > 0;
    },
    whenIdle(): Promise<void> {
      if (!sending && !pending.length) return Promise.resolve();
      return new Promise((resolve) => idleResolvers.push(resolve));
    },
  };
};
