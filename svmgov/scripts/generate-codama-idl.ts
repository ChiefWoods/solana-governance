import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { createFromRoot } from 'codama';
import { format } from 'oxfmt';

import oxfmtConfig from '../oxfmt.config.ts';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(packageDir, '..');
const anchorIdlPath = `${repoRoot}/target/idl/svmgov.json`;
const codamaIdlPath = `${packageDir}/idl/codama.json`;
const anchorIdl = await readIdl(anchorIdlPath, 'Anchor');
const codama = createFromRoot(rootNodeFromAnchor(JSON.parse(anchorIdl)));

await mkdir(dirname(codamaIdlPath), { recursive: true });
const result = await format(codamaIdlPath, codama.getJson(), oxfmtConfig);
if (result.errors.length > 0) {
    throw new Error(
        `Failed to format the generated Codama IDL:\n${result.errors.map(error => error.message).join('\n')}`,
    );
}
await writeFile(codamaIdlPath, result.code);
console.log(`Wrote ${codamaIdlPath}`);

async function readIdl(path: string, kind: string) {
    try {
        return await readFile(path, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`Failed to load ${kind} IDL: ${path} does not exist`);
        }
        throw error;
    }
}
