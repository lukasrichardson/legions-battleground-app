import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import { fetchPublishedDeckFilterOptions } from "@/client/utils/api.utils";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

describe("fetchPublishedDeckFilterOptions", () => {
  it("unwraps the published-deck filter-options response before invoking the callback", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "http://example.test" } },
      configurable: true,
    });
    vi.mocked(axios.get).mockResolvedValue({ data: { filterOptions: { legion: ["angels", "dwarfs"] } } });
    const callback = vi.fn();

    await fetchPublishedDeckFilterOptions(callback);

    expect(callback).toHaveBeenCalledWith({ legion: ["angels", "dwarfs"] });
  });
});
