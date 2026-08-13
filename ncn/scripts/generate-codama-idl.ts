import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(packageDir, "..");
const anchorIdlPath = `${repoRoot}/target/idl/ncn_snapshot.json`;
const codamaIdlPath = `${packageDir}/idl/codama.json`;
const anchorIdl = await readIdl(anchorIdlPath, "Anchor");
const codama = createFromRoot(rootNodeFromAnchor(JSON.parse(anchorIdl)));

await mkdir(dirname(codamaIdlPath), { recursive: true });
await writeFile(codamaIdlPath, codama.getJson());
console.log(`Wrote ${codamaIdlPath}`);

async function readIdl(path: string, kind: string) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Failed to load ${kind} IDL: ${path} does not exist`);
    }
    throw error;
  }
}
