/** Player-relative copy for game UI, without internal target identifiers. */
export function gameZoneLabel(target: string | null | undefined, side: "p1" | "p2", column?: number | null) {
  const zone = target?.replace(/^(p[12]Player|controller)/, "");
  const names: Record<string, string> = {
    Hand: "hand", Deck: "deck", Discard: "discard", Eradication: "eradication",
    Fortifieds: "fortified zone", Unifieds: "unified zone", Warriors: "warrior zone",
    Fortified: "fortified zone", Unified: "unified zone", Warrior: "warrior zone",
    Guardian: "guardian", Synergy: "synergy", VeilRealm: "veil / realm", Warlord: "warlord",
    Tokens: "tokens", Revealed: "revealed cards",
  };
  if (!zone || !names[zone]) return "Card pile";
  const owner = target?.startsWith(side === "p1" ? "p2Player" : "p1Player") ? "Opponent’s" : "Your";
  return `${owner} ${names[zone]}${column !== undefined && column !== null ? ` · column ${column + 1}` : ""}`;
}

export function gameViewingLabel(viewing: string, side: "p1" | "p2") {
  const limited = /^(top|bottom) (\d+) of (.+)$/.exec(viewing);
  if (limited) return `${limited[1]} ${limited[2]} of ${gameZoneLabel(limited[3], side).toLowerCase()}`;
  return gameZoneLabel(viewing, side).toLowerCase();
}
