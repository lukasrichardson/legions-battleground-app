/** Community deck browsing is public; all deck routes are player-owned. */
export function isPersonalDeckPath(pathname: string): boolean {
  return /^\/decks(?:\/.*)?$/.test(pathname);
}
