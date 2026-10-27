# =============================================================================
# Image frontend An Tâm Clinic (React 19 + Vite) chạy trên nginx
#
#   docker build -t antam-clinic-frontend .
#
# nginx phục vụ bản build và chuyển /api, /v3, /swagger-ui sang backend
# (giống proxy của vite dev). Địa chỉ backend đặt bằng biến môi trường API_UPSTREAM
# (mặc định http://api:8080 — tên service trong docker-compose.yml).
# =============================================================================

# ---- 1. Build bằng Vite -------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Cài package thành một lớp riêng: chỉ cài lại khi package*.json thay đổi
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# vite.config.ts mặc định build vào ../backend/src/main/resources/static (để backend tự phục vụ);
# trong image thì build vào dist/ của chính nó
RUN npx tsc -b && npx vite build --outDir dist

# ---- 2. Phục vụ bằng nginx ----------------------------------------------------
FROM nginx:stable-alpine

# Image nginx tự thay ${API_UPSTREAM} trong /etc/nginx/templates/*.template lúc khởi động
ENV API_UPSTREAM=http://api:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
