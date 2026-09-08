import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve("client/src");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("Workspaces V2", () => {
  it("renderiza Insights compartilhado nos dois workspaces", () => {
    expect(read("pages/project/ProjectWorkspace.tsx")).toContain("WorkspaceInsights");
    expect(read("pages/project/expansion/ExpansionWorkspace.tsx")).toContain("WorkspaceInsights");
  });

  it("mantém fallback explícito para seção desconhecida", () => {
    expect(read("pages/project/ProjectWorkspace.tsx")).toContain("UnavailableWorkspaceSection");
    expect(read("pages/project/expansion/ExpansionWorkspace.tsx")).toContain(
      "UnavailableWorkspaceSection"
    );
  });

  it("não reintroduz bloqueio de zoom, contraste baixo ou fonte abaixo de 11px", () => {
    expect(read("../index.html")).not.toContain("maximum-scale");
    const files = fs.readdirSync(path.join(root, "pages"), { recursive: true, encoding: "utf8" });
    const content = files
      .filter(file => file.endsWith(".tsx"))
      .map(file => read(path.join("pages", file)))
      .join("\n");
    expect(content).not.toMatch(/text-white\/(?:1\d|2\d|3\d|4\d)\b/);
    expect(content).not.toMatch(/text-\[(?:8|9|10)px\]/);
  });
});
