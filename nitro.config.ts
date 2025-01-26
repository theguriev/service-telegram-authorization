import { camelCase } from 'scule'
import importsHelper from './importsHelper';

//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2025-01-26",
  runtimeConfig: {
    mongoUri: 'mongodb://root:example@localhost:27017/',
  },
  imports: {
    imports: [
      ...(await importsHelper('./db/model')),
      ...(await importsHelper('./db/schema', camelCase)),
      { name: 'parse', from: 'set-cookie-parser' }
    ],
    presets: [
      {
        from: 'zod',
        imports: ['z']
      }
    ],
    dirs: ['./composables']
  }
});