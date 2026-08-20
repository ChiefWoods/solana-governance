import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderVisitor as renderJsVisitor } from '@codama/renderers-js';
import { renderVisitor as renderRustVisitor } from '@codama/renderers-rust';
import { createFromJson } from 'codama';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const codamaIdlPath = `${packageDir}/idl/codama.json`;
const tsClientDir = `${packageDir}/clients/ts`;
const rustClientDir = `${packageDir}/clients`;
const codamaIdl = await readIdl(codamaIdlPath);
const codama = createFromJson(codamaIdl);

await codama.accept(
    renderJsVisitor(tsClientDir, {
        deleteFolderBeforeRendering: true,
        formatCode: true,
        generatedFolder: '',
        kitImportStrategy: 'preferRoot',
        syncPackageJson: false,
    }),
);
console.log(`Wrote solana/kit client to ${tsClientDir}`);

await codama.accept(
    renderRustVisitor(rustClientDir, {
        deleteFolderBeforeRendering: true,
        formatCode: true,
        generatedFolder: 'rust',
        syncCargoToml: false,
    }),
);
console.log(`Wrote rust client to ${rustClientDir}/rust`);

async function readIdl(path: string) {
    try {
        return await readFile(path, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`Failed to load Codama IDL: ${path} does not exist`);
        }
        throw error;
    }
}
