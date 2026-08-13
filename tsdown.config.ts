import { defineConfig } from "tsdown";

export default defineConfig({
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "neutral",
  deps: {
    neverBundle: [/^@solana\//],
  },
});
