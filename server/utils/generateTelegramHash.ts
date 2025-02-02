import sha256 from "crypto-js/sha256";
import HmacSHA256 from "crypto-js/hmac-sha256";
import encHex from "crypto-js/enc-hex";
import { snakeCase } from "scule";

const generateTelegramHash = (
  data: InferSchemaType<typeof schemaUser>,
  token: string
) => {
  // Create the secret key
  const secret = sha256(token);

  // Sort and concatenate the data, excluding the "hash"
  const array = Object.entries(data).reduce<string[]>((acc, [key, value]) => {
    if (key !== "hash") {
      acc.push(`${snakeCase(key)}=${value}`);
    }
    return acc;
  }, []);

  // Generate the HMAC hash
  return HmacSHA256(array.sort().join("\n"), secret).toString(encHex);
};

export default generateTelegramHash;
