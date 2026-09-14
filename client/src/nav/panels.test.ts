import { describe, expect, it } from "vitest";
import { NAV_PANELS } from "./panels";

describe("Navegação em painéis", () => {
  it("cada painel tem ao menos uma aba e um caminho único", () => {
    const paths = new Set<string>();
    for (const panel of NAV_PANELS) {
      expect(panel.tabs.length).toBeGreaterThan(0);
      for (const tab of panel.tabs) {
        expect(paths.has(tab.path)).toBe(false);
        paths.add(tab.path);
      }
    }
  });

  it("não repete o identificador de painel", () => {
    const ids = NAV_PANELS.map(panel => panel.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mantém Cadastros e Gestão restritos à administração", () => {
    const catalog = NAV_PANELS.find(panel => panel.id === "catalog");
    const management = NAV_PANELS.find(panel => panel.id === "management");
    expect(catalog?.access).toBe("admin");
    expect(management?.access).toBe("admin");
  });

  it("mantém o Financeiro restrito a quem tem escopo financeiro", () => {
    const finance = NAV_PANELS.find(panel => panel.id === "finance");
    expect(finance?.access).toBe("finance");
  });
});
