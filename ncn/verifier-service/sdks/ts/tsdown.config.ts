import { defineConfig, mergeConfig } from 'tsdown';

import baseConfig from '../../../../tsdown.config.ts';

export default defineConfig(
    mergeConfig(baseConfig, {
        entry: './src/index.ts',
        outDir: './dist',
        tsconfig: './tsconfig.build.json',
    }),
);
