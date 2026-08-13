import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderVisitor } from "renderers-web3js";
import { createFromJson } from "codama";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const codamaIdlPath = `${packageDir}/idl/codama.json`;
const clientDir = `${packageDir}/clients/ts`;
const codamaIdl = await readIdl(codamaIdlPath);
const codama = createFromJson(codamaIdl);

await codama.accept(
  renderVisitor(clientDir, {
    deleteFolderBeforeRendering: true,
    formatCode: true,
    packageFolder: "",
    syncPackageJson: false,
  }),
);
console.log(`Wrote solana/kit client to ${clientDir}`);

async function readIdl(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Failed to load Codama IDL: ${path} does not exist`);
    }
    throw error;
  }
}
