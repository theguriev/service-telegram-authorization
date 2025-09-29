import { camelCase } from "scule";
import importsHelper from "./importsHelper";

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
    lokiHost: "http://localhost:3100",
    lokiBasicAuth: undefined as string | undefined,
  },
  experimental: {
    tasks: true,
  },
  scheduledTasks: {
    "0 21 * * *": ["wallet:daily", "wallet:daily-spend"],
    "0 7 * * *": ["wallet:manager-daily"],
  },
  imports: {
    imports: [
      ...(await importsHelper("./db/model")),
      ...(await importsHelper("./db/schema", camelCase)),
      { name: "parse", from: "set-cookie-parser" },
      { name: "destr", from: "destr" },
      { name: "omit", from: "es-toolkit" },
      { name: "v4", as: "uuidv4", from: "uuid" },
      { name: "Wallet", from: "ethers" },
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
