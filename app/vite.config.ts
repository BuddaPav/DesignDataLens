/// <reference types="vitest/config" />
import path from "path"
import { readFileSync } from "node:fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __CHRONOS_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx", "./src/components/screens/GameScreen.tsx"],
    },
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 6500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/three")) {
            return "three-vendor";
          }
          if (
            id.includes("node_modules/@react-three") ||
            id.includes("node_modules/postprocessing")
          ) {
            return "r3f-vendor";
          }
          if (id.includes("node_modules/@mlc-ai")) {
            return "llm-vendor";
          }
        },
      },
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage'
    }
  }
});
