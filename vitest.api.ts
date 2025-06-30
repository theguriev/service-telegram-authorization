import { resolve } from "pathe";
import Unimport from "unimport/unplugin";
import { defineConfig } from "vitest/config";
import { imports } from "./constants";

export default defineConfig({
  plugins: [
    Unimport.vite({
      imports: [
        ...imports,
        { name: "$fetch", from: "ofetch" },
        {
          name: "default",
          as: "ModelToken",
          from: "./db/model/token.ts",
        },
        {
          name: "default",
          as: "ModelUser",
          from: "./db/model/user.ts",
        },
        {
          name: "default",
          as: "ModelWallet",
          from: "./db/model/wallet.ts",
        },
        {
          name: "default",
          as: "schemaToken",
          from: "./db/schema/token.ts",
        },
        {
          name: "default",
          as: "schemaUser",
          from: "./db/schema/user.ts",
        },
        {
          name: "default",
          as: "schemaWallet",
          from: "./db/schema/wallet.ts",
        },
      ],
      dirs: ["./server/utils"],
      dts: true,
    }),
  ],
  test: {
    include: ["./test-api/*.test.ts"],
    globalSetup: "./global-setup.ts",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
