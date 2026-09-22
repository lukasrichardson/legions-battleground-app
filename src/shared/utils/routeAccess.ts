/** Community deck browsing is public; all other deck routes are player-owned. */
export function isPersonalDeckPath(pathname: string): boolean {
  return /^\/decks(?:\/(?!browse(?:\/|$)).*)?$/.test(pathname);
}
