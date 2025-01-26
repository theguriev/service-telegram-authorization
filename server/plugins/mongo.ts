import { connect } from 'mongoose'

export default defineNitroPlugin(async () => {
  const { mongoUri } = useRuntimeConfig()
  console.info('🚚 Connecting...', mongoUri)
  await connect(mongoUri)
  console.info('Connected to MongoDB 🚀', mongoUri)
})
