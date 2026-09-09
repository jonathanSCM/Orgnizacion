import { randomBytes } from "crypto";

export function generateApiToken() {
  return `panel_${randomBytes(24).toString("hex")}`;
}
