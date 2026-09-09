import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}
