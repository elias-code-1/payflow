import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { CapacitorConfig } from "@capacitor/cli";

function readEnvFile(fileName: string): Record<string, string> {
  try {
    const fullPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(fullPath)) return {};
    return dotenv.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return {};
  }
}

const dotEnv = readEnvFile(".env");
const exampleEnv = readEnvFile(".env.example");

const configuredBaseUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  dotEnv.CAPACITOR_SERVER_URL ||
  exampleEnv.CAPACITOR_SERVER_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/dashboard(?:\.html)?$/i, "");

const fallbackLocalUrl = process.env.GITHUB_ACTIONS === "true" ? "" : "http://10.0.2.2:3000";
const effectiveBaseUrl = configuredBaseUrl || fallbackLocalUrl;
const serverUrl = effectiveBaseUrl ? `${effectiveBaseUrl}/dashboard.html` : "";

const config: CapacitorConfig = {
  appId: "org.payflow.local",
  appName: "PayFlow Dashboard",
  webDir: "dist",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : {
        androidScheme: "https",
      },
};

export default config;
