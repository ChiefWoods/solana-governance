import { defineConfig } from "oxlint";

import solanaConfig from "@solana-config/oxc/oxlint";

export default defineConfig({
  extends: [solanaConfig],
});
