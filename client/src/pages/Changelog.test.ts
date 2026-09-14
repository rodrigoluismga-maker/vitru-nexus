import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => fs.readFileSync(path.resolve("client/src", relative), "utf8");

describe("Changelog", () => {
  it("distingue loading, erro e vazio como estados próprios", () => {
    const content = read("pages/Changelog.tsx");
    expect(content).toContain("query.isLoading");
    expect(content).toContain("query.isError");
    expect(content).toContain("EmptyState");
  });

  it("está registrado na rota e na navegação principal", () => {
    expect(read("App.tsx")).toContain('path={"/changelog"}');
    expect(read("nav/panels.ts")).toContain('path: "/changelog"');
  });
});
