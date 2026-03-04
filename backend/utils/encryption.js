import crypto from "crypto";

const algorithm = "aes-256-cbc";
const ivLength = 16;
const secretKey = process.env.MESSAGE_SECRET_KEY;

export const encrypt = (text) => {
  if (!text) return text;

  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (text) => {
  try {
    if (!text || typeof text !== "string") return text;

    // Must contain colon
    if (!text.includes(":")) return text;

    const [ivHex, encryptedText] = text.split(":");

    // IV must be 32 hex characters (16 bytes)
    if (!/^[0-9a-fA-F]{32}$/.test(ivHex)) return text;

    const iv = Buffer.from(ivHex, "hex");

    if (iv.length !== 16) return text;

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Decryption failed safely:", err.message);
    return text; // Return original value instead of crashing
  }
};
