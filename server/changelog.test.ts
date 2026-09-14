import { describe, expect, it } from "vitest";
import { CHANGELOG_ENTRIES, LEGACY_MANUS_CHECKPOINTS } from "./data/changelog";

describe("Changelog", () => {
  it("cada entrada tem data ISO, identificador único e ao menos um destaque real", () => {
    expect(CHANGELOG_ENTRIES.length).toBeGreaterThan(0);
    const ids = new Set<string>();
    for (const entry of CHANGELOG_ENTRIES) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.highlights.length).toBeGreaterThan(0);
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
    }
  });

  it("ordena as entradas da mais recente para a mais antiga", () => {
    const dates = CHANGELOG_ENTRIES.map(entry => entry.date);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    expect(dates).toEqual(sorted);
  });

  it("não atribui data inventada aos checkpoints legados do Manus", () => {
    expect(LEGACY_MANUS_CHECKPOINTS.length).toBeGreaterThan(0);
    for (const checkpoint of LEGACY_MANUS_CHECKPOINTS) {
      expect(checkpoint).not.toHaveProperty("date");
      expect(checkpoint.hash.length).toBeGreaterThan(0);
    }
  });
});
