import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Khi dev: mọi lời gọi /api, /swagger-ui, /v3 chuyển sang Spring Boot ở cổng 8080 → không cần CORS
    proxy: {
      '/api': 'http://localhost:8080',
      '/swagger-ui': 'http://localhost:8080',
      '/v3': 'http://localhost:8080',
    },
  },
  build: {
    // Đóng gói: build thẳng vào static của backend → ./mvnw package ra 1 file jar chứa cả FE
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
