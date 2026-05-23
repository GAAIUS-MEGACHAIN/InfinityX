import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const files = [
  "public/registry/chains.json",
  "public/registry/top-3000-tokens.json",
  "public/registry/markets.json",
  "public/registry/dapps.json",
  "public/registry/nfts.json",
  "public/registry/metaverse.json"
];

mkdirSync("public/update-packs", { recursive: true });
const entries = files.map((path) => {
  const bytes = readFileSync(path);
  const gz = gzipSync(bytes, { level: 9 });
  const out = join("public/update-packs", `${basename(path)}.gz`);
  writeFileSync(out, gz);
  return {
    source: path,
    pack: out.replaceAll("\\", "/"),
    sha256: createHash("sha256").update(gz).digest("hex"),
    bytes: gz.length
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  releaseChannel: "github-releases",
  entries
};

writeFileSync("public/update-packs/manifest.json", JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ packs: entries.length, manifest: "public/update-packs/manifest.json" }, null, 2));
