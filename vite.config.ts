import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Khi dev: mọi lời gọi /api, /swagger-ui, /v3 chuyển sang ExpressJS backend ở cổng 8082
    proxy: {
      '/api': 'http://localhost:8082',
      '/swagger-ui': 'http://localhost:8082',
      '/v3': 'http://localhost:8082',
    },
  },
  build: {
    // Đóng gói: build thẳng vào public của backend ExpressJS
    outDir: '../backend/public',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
