import { defineConfig } from 'oxlint';

import rootConfig from '../oxlint.config.ts';

export default defineConfig({
    extends: [rootConfig],
    ignorePatterns: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/components/ui/**'],
    plugins: ['import', 'jsx-a11y', 'nextjs', 'react'],
    rules: {
        'sort-keys': 'off',
    },
});
