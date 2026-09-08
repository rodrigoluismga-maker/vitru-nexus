import fs from "node:fs";
import path from "node:path";

const root = path.resolve("client/src");

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && target.endsWith(".tsx") ? [target] : [];
  });
}

function textToken(opacity) {
  const value = Number(opacity);
  if (value >= 80) return "text-content-primary";
  if (value >= 60) return "text-content-secondary";
  return "text-content-tertiary";
}

let changed = 0;
for (const file of collect(root)) {
  const source = fs.readFileSync(file, "utf8");
  const transformed = source
    .replace(/text-white\/(\d{1,3})\b/g, (_, opacity) => textToken(opacity))
    .replace(/text-\[(?:8|9|10)px\]/g, "text-[11px]");
  if (transformed !== source) {
    fs.writeFileSync(file, transformed);
    changed += 1;
  }
}

const preservedPrimaryFiles = new Set([
  path.join(root, "components/AIChatBox.tsx"),
  path.join(root, "components/ErrorBoundary.tsx"),
  path.join(root, "pages/ComponentShowcase.tsx"),
]);

for (const file of collect(root)) {
  const source = fs.readFileSync(file, "utf8");
  let transformed = source
    .replace(/\btext-secondary\b/g, "text-content-secondary")
    .replace(/\btext-tertiary\b/g, "text-content-tertiary");
  if (!preservedPrimaryFiles.has(file)) {
    transformed = transformed.replace(/\btext-primary\b/g, "text-content-primary");
  }
  if (transformed !== source) {
    fs.writeFileSync(file, transformed);
    changed += 1;
  }
}

console.log(`Arquivos atualizados: ${changed}`);
