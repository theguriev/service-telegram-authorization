import { camelCase } from "scule";
import importsHelper from "./importsHelper";

const GLOB_EXTENSIONS = ".{js,mjs,cjs,ts,mts,cts,tsx,jsx}";

//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2025-01-26",
  runtimeConfig: {
    mongoUri: "mongodb://root:example@localhost:27017/",
    botToken: "",
    secret: "gurievcreative",
    walletPrivateKey: "",
    notificationBase: "http://localhost:4000",
    currencySymbol: "nka",
  },
  experimental: {
    tasks: true,
  },
  scheduledTasks: {
    "0 21 * * *": ["wallet:daily-spend"],
    "0 7 * * *": ["wallet:manager-daily"],
  },
  imports: {
    imports: [
      ...(await importsHelper("./db/model")),
      ...(await importsHelper("./db/schema", camelCase)),
      ...(await importsHelper("./server/permission", camelCase)),
      { name: "v4", as: "uuidv4", from: "uuid" },
      { name: "InferSchemaType", from: "mongoose", type: true },
      { name: "parse", from: "set-cookie-parser" },
      { name: "destr", from: "destr" },
      { name: "omit", from: "es-toolkit" },
      { name: "Wallet", from: "ethers" },
      { name: "can", from: "~/permission" },
      { name: "matchCan", from: "~/permission" },
    ],
    presets: [
      {
        from: "zod",
        imports: ["z"],
      },
    ],
    dirs: ["./server/composables"],
  },
});
