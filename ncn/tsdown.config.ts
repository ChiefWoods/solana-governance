import { defineConfig, mergeConfig } from "tsdown";
import baseConfig from "../tsdown.config.ts";

export default defineConfig(mergeConfig(baseConfig, {
  entry: "./clients/ts/index.ts",
  outDir: "./dist",
  tsconfig: "./tsconfig.build.json",
}));
