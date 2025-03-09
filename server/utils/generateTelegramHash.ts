import crypto from "crypto";
import { snakeCase } from "scule";

const generateTelegramHash = (
  data: InferSchemaType<typeof schemaUser>,
  token: string
) => {
  // Create the secret key
  const secret = crypto.createHash("sha256").update(token).digest();

  // Sort and concatenate the data, excluding the "hash"
  const array = Object.entries(data).reduce<string[]>((acc, [key, value]) => {
    if (key !== "hash") {
      acc.push(`${snakeCase(key)}=${value}`);
    }
    return acc;
  }, []);

  // Generate the HMAC hash
  return crypto
    .createHmac("sha256", secret)
    .update(array.sort().join("\n"))
    .digest("hex");
};

export default generateTelegramHash;
