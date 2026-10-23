import axios from "axios";

/** Read public API messages, including legacy text responses; keep transport errors out of the UI. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const data: unknown = error.response?.data;
  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) return data;
  if (data && typeof data === "object") {
    for (const field of ["message", "error"]) {
      const value = (data as Record<string, unknown>)[field];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return fallback;
}
