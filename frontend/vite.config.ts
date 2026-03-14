import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: env.VITE_BASE || "/",
    plugins: [react(), tailwindcss(), basicSsl()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "../shared")
      },
    },
    server: {
      https: true,
      hmr: process.env.DISABLE_HMR !== "true"
        ? {
            protocol: "wss",
            host: "localhost",
            clientPort: 5173
          }
        : false,
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://checkout.razorpay.com",
          "frame-src 'self' https://challenges.cloudflare.com https://checkout.razorpay.com https://api.razorpay.com",
          "connect-src 'self' http: https: ws: wss: https://challenges.cloudflare.com https://api.razorpay.com",
          "img-src 'self' data: blob: https:",
          "style-src 'self' 'unsafe-inline' https:",
          "font-src 'self' data: https:"
        ].join("; ")
      },
      fs: {
        allow: [
          path.resolve(__dirname),
          path.resolve(__dirname, ".."),
          path.resolve(__dirname, "../shared")
        ]
      },
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true
        }
      }
    },
  };
});
