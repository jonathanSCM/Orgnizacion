import { randomBytes, createHash } from "crypto";

export function generateApiToken() {
  const token = `panel_${randomBytes(24).toString("hex")}`;
  return { token, tokenHash: hashApiToken(token), tokenLast4: token.slice(-4) };
}

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
