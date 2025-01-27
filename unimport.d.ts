export {}
declare global {
  const $fetch: typeof import('ofetch')['$fetch']
  const afterAll: typeof import('vitest')['afterAll']
  const beforeAll: typeof import('vitest')['beforeAll']
  const describe: typeof import('vitest')['describe']
  const expect: typeof import('vitest')['expect']
  const extractSetCookie: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/extractSetCookie')['default']
  const generateTelegramHash: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/generateTelegramHash')['default']
  const isValidTelegramHash: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/isValidTelegramHash')['default']
  const issueAccessToken: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/issueAccessToken')['default']
  const issueRefreshToken: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/issueRefreshToken')['default']
  const it: typeof import('vitest')['it']
  const parse: typeof import('set-cookie-parser')['parse']
  const passwordHash: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/passwordHash')['default']
  const uuidv4: typeof import('uuid')['v4']
  const zodValidateBody: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/zodValidateBody')['default']
  const zodValidateData: typeof import('/Users/gurieveugen/work/service-telegram-authorization/server/utils/zodValidateData')['default']
}