import { defineConfig } from "oxlint";

import rootConfig from "../oxlint.config.ts";

export default defineConfig({
  extends: [rootConfig],
  ignorePatterns: [".next/**", "out/**", "build/**", "coverage/**"],
  plugins: ["nextjs", "react", "react-perf", "jest"]
});
