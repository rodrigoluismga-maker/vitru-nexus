import fs from "node:fs";
import path from "node:path";

const root = path.resolve("client/src");
const tokenByHex = new Map(
  Object.entries({
    "#ffc20e": "--brand-accent",
    "#ffd24a": "--brand-accent-hover",
    "#ffd04a": "--brand-accent-hover",
    "#ffd45c": "--brand-accent-soft",
    "#ffd760": "--brand-accent-soft",
    "#ffe28b": "--brand-accent-soft",
    "#a689f7": "--brand-violet",
    "#6824d3": "--brand-violet-deep",
    "#c9bbff": "--brand-violet-soft",
    "#d4b7ff": "--brand-violet-soft",
    "#d4c9ff": "--brand-violet-soft",
    "#c6b5ff": "--brand-violet-soft",
    "#c2adff": "--brand-violet-soft",
    "#201429": "--surface-3",
    "#120d1b": "--surface-2",
    "#120d1c": "--surface-2",
    "#171020": "--surface-2",
    "#140e1e": "--surface-2",
    "#100c18": "--surface-1",
    "#100c16": "--surface-1",
    "#100a19": "--surface-1",
    "#0e0a15": "--surface-1",
    "#0d0913": "--surface-1",
    "#0c0712": "--surface-0",
    "#09070f": "--surface-0",
    "#08060d": "--surface-0",
    "#08060c": "--surface-0",
    "#ff8b72": "--direction-up",
    "#ffad9a": "--direction-up-soft",
    "#ff8795": "--status-negative",
    "#ffb4bd": "--status-negative",
    "#ff7d8e": "--status-negative",
    "#ff7b7b": "--status-negative",
    "#ff6b6b": "--status-negative",
    "#fb7185": "--status-negative",
    "#65a6ff": "--status-info",
    "#7ab4ff": "--status-info",
    "#67e8f9": "--direction-down",
    "#56e8a9": "--status-positive",
    "#34d399": "--status-positive",
    "#3ddc97": "--status-positive",
    "#64748b": "--neutral-slate",
    "#858481": "--neutral-mid",
    "#34322d": "--neutral-dark",
    "#21142c": "--ink-strong",
    "#1b1028": "--ink-strong",
    "#1a1a19": "--ink-neutral",
    "#281352": "--brand-violet-deep",
    "#f8f8f7": "--content-solid",
  }).map(([hex, token]) => [hex.toLowerCase(), token])
);

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && target.endsWith(".tsx") ? [target] : [];
  });
}

let changed = 0;
const unresolved = new Set();
for (const file of collect(root)) {
  if (file.includes(`${path.sep}components${path.sep}ui${path.sep}`)) continue;
  const source = fs.readFileSync(file, "utf8");
  const transformed = source.replace(/#[0-9a-fA-F]{6}/g, value => {
    const token = tokenByHex.get(value.toLowerCase());
    if (!token) {
      unresolved.add(value.toLowerCase());
      return value;
    }
    return `var(${token})`;
  });
  if (transformed !== source) {
    fs.writeFileSync(file, transformed);
    changed += 1;
  }
}

console.log(`Arquivos atualizados: ${changed}`);
if (unresolved.size) {
  console.error(`Hex sem token: ${Array.from(unresolved).sort().join(", ")}`);
  process.exitCode = 1;
}
