import fs from "node:fs";
import path from "node:path";

const roots = [path.resolve("client/src"), path.resolve("server")];

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && /\.(ts|tsx)$/.test(target) ? [target] : [];
  });
}

const pair = /\[\s*("(?:\\.|[^"\\])*")\s*,\s*("(?:\\.|[^"\\])*")\s*,?\s*\]\.join\(""\)/g;
let changed = 0;

for (const file of roots.flatMap(collect)) {
  const source = fs.readFileSync(file, "utf8");
  const restored = source.replace(pair, (_, first, second) => {
    return JSON.stringify(JSON.parse(first) + JSON.parse(second));
  });
  if (restored !== source) {
    fs.writeFileSync(file, restored);
    changed += 1;
  }
}

console.log(`Arquivos restaurados: ${changed}`);
