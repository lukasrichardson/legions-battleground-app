import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";
import { SPECIAL_MAIN_DECK_FIELDS, SpecialMainDeckField } from "@/shared/deckComposition";

export type EditableDeckSnapshot = {
  name: string;
  subtitle: string;
  legion: string;
  cards_in_deck: string[];
  side_deck: string[];
  warlords: string[];
  synergies: string[];
  veilRealms: string[];
  guardians: string[];
};

export class DeckPatchInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckPatchInputError";
  }
}

const isPatchOperation = (value: unknown): value is DeckPatchOperation =>
  typeof value === "object"
  && value !== null
  && !Array.isArray(value)
  && typeof (value as { op?: unknown }).op === "string"
  && typeof (value as { path?: unknown }).path === "string";

const listIndexFor = (path: string, listPath: string): number | null => {
  const prefix = `${listPath}/`;
  if (!path.startsWith(prefix)) return null;
  const segment = path.slice(prefix.length);
  return /^0$|^[1-9]\d*$/.test(segment) ? Number(segment) : null;
};

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== "string") throw new DeckPatchInputError(`${path} must be a string.`);
  return value;
};

const requireStringList = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new DeckPatchInputError(`${path} must be an array of card IDs.`);
  }
  return [...value];
};

const applyListOperation = (
  snapshot: EditableDeckSnapshot,
  operation: DeckPatchOperation,
  listKey: "cards_in_deck" | "side_deck" | SpecialMainDeckField,
): void => {
  const listPath = `/${listKey}`;
  const list = snapshot[listKey];

  if (operation.op === "replace" && operation.path === listPath) {
    snapshot[listKey] = requireStringList(operation.value, listPath);
    return;
  }
  if (operation.op === "add" && operation.path === `${listPath}/-`) {
    list.push(requireString(operation.value, operation.path));
    return;
  }
  const index = listIndexFor(operation.path, listPath);
  if (operation.op === "remove" && index !== null && index < list.length) {
    list.splice(index, 1);
    return;
  }
  throw new DeckPatchInputError(`Unsupported deck patch operation at ${operation.path}.`);
};

/**
 * Applies the deliberately small JSON Patch profile used by the deck editor.
 * The result is fed into the existing deck-input parser and legality validator.
 */
export const applyDeckJsonPatch = (
  deck: EditableDeckSnapshot,
  operations: unknown,
): EditableDeckSnapshot => {
  if (!Array.isArray(operations) || !operations.length || !operations.every(isPatchOperation)) {
    throw new DeckPatchInputError("Request body must be a non-empty JSON Patch array.");
  }

  const snapshot: EditableDeckSnapshot = {
    ...deck,
    cards_in_deck: [...deck.cards_in_deck],
    side_deck: [...deck.side_deck],
    warlords: [...deck.warlords],
    synergies: [...deck.synergies],
    veilRealms: [...deck.veilRealms],
    guardians: [...deck.guardians],
  };

  for (const operation of operations) {
    if (operation.path === "/name" || operation.path === "/subtitle" || operation.path === "/legion") {
      if (operation.op !== "replace") {
        throw new DeckPatchInputError(`Only replace is supported at ${operation.path}.`);
      }
      snapshot[operation.path.slice(1) as "name" | "subtitle" | "legion"] = requireString(operation.value, operation.path);
      continue;
    }
    if (operation.path === "/cards_in_deck" || operation.path.startsWith("/cards_in_deck/")) {
      applyListOperation(snapshot, operation, "cards_in_deck");
      continue;
    }
    if (operation.path === "/side_deck" || operation.path.startsWith("/side_deck/")) {
      applyListOperation(snapshot, operation, "side_deck");
      continue;
    }
    const specialField = SPECIAL_MAIN_DECK_FIELDS.find((field) => operation.path === `/${field}` || operation.path.startsWith(`/${field}/`));
    if (specialField) {
      applyListOperation(snapshot, operation, specialField);
      continue;
    }
    throw new DeckPatchInputError(`${operation.path} cannot be updated.`);
  }

  return snapshot;
};
