import { connect } from "mongoose";

export default defineNitroPlugin(async () => {
  const { mongoUri } = useRuntimeConfig();
  console.info("\x1b[35m%s\x1b[0m", "🚚 Connecting... 🚀", mongoUri);
  await connect(mongoUri);
  console.info("\x1b[32m%s\x1b[0m", "✓", "Connected to MongoDB");
  console.log("\x1b[35m%s\x1b[0m", mongoUri);
});
