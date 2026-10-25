import type { CapacitorConfig } from "@capacitor/cli";

const baseUrl = (process.env.CAPACITOR_SERVER_URL || "http://10.0.2.2:3000").replace(/\/+$/, "");
const serverUrl = `${baseUrl}/dashboard.html`;

const config: CapacitorConfig = {
  appId: "org.payflow.local",
  appName: "PayFlow Dashboard",
  webDir: "dist",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
