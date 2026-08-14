import { defineConfig } from 'oxfmt';

import rootConfig from '../oxfmt.config.ts';

export default defineConfig({
    ...rootConfig,
    ignorePatterns: [...(rootConfig.ignorePatterns ?? []), '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
});
