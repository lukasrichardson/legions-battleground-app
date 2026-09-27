/** The small JSON Patch profile supported by personal deck editing. */
export type DeckPatchOperation = {
  op: "add" | "remove" | "replace";
  path: string;
  value?: unknown;
};
