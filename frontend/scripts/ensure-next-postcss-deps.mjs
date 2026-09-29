import fs from "node:fs";
import path from "node:path";

const packages = ["picocolors", "nanoid", "source-map-js"];
const destRoot = path.join("node_modules", "next", "node_modules");

if (!fs.existsSync(path.join("node_modules", "next"))) {
  process.exit(0);
}

fs.mkdirSync(destRoot, { recursive: true });

for (const name of packages) {
  const from = path.join("node_modules", name);
  const to = path.join(destRoot, name);
  if (!fs.existsSync(from)) {
    continue;
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}
