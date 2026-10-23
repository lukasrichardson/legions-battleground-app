import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/client/utils/apiError";

function apiError(data: unknown) {
  return new AxiosError("Request failed", undefined, undefined, undefined, { data } as AxiosResponse);
}

describe("getApiErrorMessage", () => {
  it.each([
    [{ error: "Conflict", message: "You already have a deck with this name." }, "You already have a deck with this name."],
    [{ error: "Authentication required" }, "Authentication required"],
    ["Legacy validation message", "Legacy validation message"],
  ])("reads supported public error responses: %j", (data, message) => {
    expect(getApiErrorMessage(apiError(data), "Try again")).toBe(message);
  });

  it.each([undefined, null, {}, { message: 42 }, "", "  ", "<!doctype html><html>Server error</html>"])
  ("uses the fallback for unusable responses: %j", (data) => {
    expect(getApiErrorMessage(apiError(data), "Try again")).toBe("Try again");
  });

  it("uses the fallback for network failures", () => {
    expect(getApiErrorMessage(new AxiosError("Network Error"), "Check your connection")).toBe("Check your connection");
  });

  it("preserves local errors and handles unknown throws", () => {
    expect(getApiErrorMessage(new Error("Missing deck ID"), "Try again")).toBe("Missing deck ID");
    expect(getApiErrorMessage(null, "Try again")).toBe("Try again");
  });
});
