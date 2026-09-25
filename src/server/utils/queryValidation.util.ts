export const MAX_CARD_PAGE_SIZE = 100;
export const MAX_CARD_SEARCH_LENGTH = 100;

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const positiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : fallback;
};

export const parseCardPagination = (page: unknown, pageSize: unknown) => {
  const requestedPage = positiveInteger(page, 1);
  const requestedPageSize = positiveInteger(pageSize, 50);
  return {
    page: requestedPage,
    pageSize: Math.min(requestedPageSize, MAX_CARD_PAGE_SIZE),
  };
};

export const parseCardSearch = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return escapeRegex(trimmed.slice(0, MAX_CARD_SEARCH_LENGTH));
};
