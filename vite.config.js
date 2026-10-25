const { defineConfig } = require("vite");
const path = require("path");

module.exports = defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        landing: path.resolve(__dirname, "index.html"),
        dashboard: path.resolve(__dirname, "dashboard.html"),
      },
    },
  },
});
