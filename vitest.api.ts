import { defineConfig } from "vitest/config";
import Unimport from "unimport/unplugin";
import { resolve } from "pathe";
import { imports } from "./constants";

export default defineConfig({
  plugins: [
    Unimport.vite({
      imports: [...imports, { name: "$fetch", from: "ofetch" }],
      dirs: ["./server/utils"],
      dts: true,
    }),
  ],
  test: {
    // coverage: {
    //   reporter: ["text", "clover", "json"],
    // },
    include: ["./test-api/*.test.ts"],
    globalSetup: "./global-setup.ts",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
