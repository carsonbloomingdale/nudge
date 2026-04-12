import { afterEach, expect } from "bun:test";
import { cleanup } from "@testing-library/react";
import * as matchersModule from "@testing-library/jest-dom/matchers";

const matchers: Record<string, (...args: unknown[]) => unknown> = {};
for (const [key, value] of Object.entries(matchersModule)) {
  if (key !== "default" && typeof value === "function") {
    matchers[key] = value as (...args: unknown[]) => unknown;
  }
}
expect.extend(matchers);

afterEach(() => {
  cleanup();
});
