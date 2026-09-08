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

function splitAtSpace(value) {
  const midpoint = Math.floor(value.length / 2);
  let index = value.lastIndexOf(" ", midpoint);
  if (index < 35) index = value.indexOf(" ", midpoint);
  if (index < 35 || index >= value.length - 20) return null;
  return [value.slice(0, index + 1), value.slice(index + 1)];
}

let changedFiles = 0;
for (const file of roots.flatMap(collect)) {
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split("\n");
  const output = [];
  let changed = false;

  for (const line of lines) {
    if (line.length <= 140) {
      output.push(line);
      continue;
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    const attribute = line.match(/([A-Za-z][\w:-]*)="([^"\\]{80,})"/);
    if (attribute) {
      const parts = splitAtSpace(attribute[2]);
      if (parts) {
        output.push(
          line.replace(
            attribute[0],
            `${attribute[1]}={[\n${indent}  ${JSON.stringify(parts[0])},\n${indent}  ${JSON.stringify(parts[1])},\n${indent}].join("")}`
          )
        );
        changed = true;
        continue;
      }
    }

    const literals = [...line.matchAll(/"([^"\\]{80,})"/g)].sort(
      (a, b) => b[1].length - a[1].length
    );
    const literal = literals[0];
    if (literal) {
      const parts = splitAtSpace(literal[1]);
      if (parts) {
        output.push(
          line.replace(
            literal[0],
            `[${JSON.stringify(parts[0])},\n${indent}  ${JSON.stringify(parts[1])}].join("")`
          )
        );
        changed = true;
        continue;
      }
    }

    output.push(line);
  }

  if (changed) {
    fs.writeFileSync(file, output.join("\n"));
    changedFiles += 1;
  }
}

console.log(`Arquivos com strings longas quebradas: ${changedFiles}`);
