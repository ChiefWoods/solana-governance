/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}': [
    'oxfmt --no-error-on-unmatched-pattern',
    'oxlint --fix --no-error-on-unmatched-pattern',
  ],
  '*.{json,jsonc,json5,css,scss,less,md,mdx,yml,yaml,html,htm,toml,graphql,gql}':
    'oxfmt --no-error-on-unmatched-pattern',
};
