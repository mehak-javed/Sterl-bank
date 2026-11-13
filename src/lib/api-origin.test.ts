import { describe, expect, it } from "vitest";
import { apiOriginFrom } from "./api-origin";

describe("apiOriginFrom", () => {
  it("defaults to the local API", () => {
    expect(apiOriginFrom(undefined)).toBe("http://localhost:8080");
    expect(apiOriginFrom("  ")).toBe("http://localhost:8080");
  });

  it("removes a pasted line break, spaces and a trailing slash", () => {
    expect(apiOriginFrom("https://sterl-api.example.com\n")).toBe("https://sterl-api.example.com");
    expect(apiOriginFrom(" https://sterl-api.example.com/ ")).toBe("https://sterl-api.example.com");
  });

  it("refuses anything that isn't a plain http(s) address", () => {
    expect(() => apiOriginFrom("sterl-api.example.com")).toThrow(/STERL_API_URL/);
    expect(() => apiOriginFrom("https://sterl-api.example.com/api")).toThrow(/STERL_API_URL/);
    expect(() => apiOriginFrom("https://a.example.com\nhttps://b.example.com")).toThrow(/STERL_API_URL/);
  });
});
