# An Tâm Clinic — frontend

Giao diện web cho Đề tài 4 (quản lý chuỗi phòng khám tư nhân trên cụm CSDL phân tán): React 19 · Vite 8 · TypeScript · Ant Design 6 · TanStack Query · React Router.

Tài liệu đầy đủ — cách chạy cả hệ thống, API, nghiệp vụ, Docker — nằm ở repo backend: [`../backend/README.md`](../backend/README.md). Hai repo phải nằm cạnh nhau:

```
source_code/
├── backend/    repo antam-clinic-backend (Spring Boot + tài liệu, script, docker-compose)
└── frontend/   repo này
```

## Chạy khi phát triển

```bash
nvm use            # Node 24 (đọc .nvmrc; chưa có thì: nvm install)
npm install        # chỉ cần lần đầu / khi package.json đổi
npm run dev        # http://localhost:5173 — /api, /swagger-ui, /v3 chuyển sang backend ở cổng 8080
```

Cần cụm DB (`../backend/scripts/init_db.sh`) và backend đang chạy (`cd ../backend && ./mvnw spring-boot:run`).

## Lệnh khác

| Việc | Lệnh |
|---|---|
| Kiểm tra kiểu + lint | `npm run typecheck && npm run lint` |
| Build vào backend (1 file jar chứa cả FE) | `npm run build` → ghi vào `../backend/src/main/resources/static/` |
| Image Docker (nginx) | `docker build -t antam-clinic-frontend .` |
| Chạy cả FE + BE bằng Docker → http://localhost:3000 | `cd ../backend/scripts && ./docker_app.sh` |

## Cấu trúc

```
src/
├── api/                http.ts (gọi API, header X-Site, ApiError) · endpoints.ts · types.ts
├── components/common/  component Base* bọc Ant Design — màn hình chỉ import từ đây
├── pages/              mỗi màn hình một file; pages/luot/ là các khối dùng chung của form lượt khám / chữa
├── layout/             khung trang, menu.tsx (menu bên trái)
├── site/               chi nhánh đang làm việc (useSite)
└── hooks/ · utils/     useCrudMutations, định dạng tiền / ngày
nginx/default.conf.template   cấu hình nginx của image Docker
```

Quy ước chi tiết (component `Base*`, query key theo chi nhánh, form lượt…): `CLAUDE.md` và mục 5 của `../backend/README.md`.
