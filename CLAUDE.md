# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The React frontend of "An Tâm Clinic", a university distributed-database project about a chain of private clinics. The backend is a separate repo that must sit next to this one in `../backend/`. Its `CLAUDE.md` covers the API, how requests pick a database site (`X-Site`), the DB layout and the business rules; read it before changing API calls. The shared docs (`../backend/README.md`, in Vietnamese), DB scripts and Docker Compose also live there.

UI text, API error messages, code comments and docs are all in **Vietnamese**. Keep new user-facing strings in Vietnamese.

## Commands

```bash
nvm use && npm install               # Node 24 (.nvmrc)
npm run dev                          # :5173, proxies /api, /swagger-ui and /v3 to the backend on :8080
npm run typecheck && npm run lint    # tsc -b, oxlint
npm run build                        # writes into ../backend/src/main/resources/static (single jar with the FE)
docker build -t antam-clinic-frontend .   # nginx image; run the whole stack with ../backend/scripts/docker_app.sh
```

There is no frontend test suite. The backend must be running on :8080 for `npm run dev` (`cd ../backend && ./mvnw spring-boot:run`).

## Docker image

- `Dockerfile`: `node:24-alpine` runs `npm ci`, then `tsc -b` and `vite build --outDir dist` (the config's `outDir` points into the backend). `nginx:stable-alpine` then serves `dist/` with `nginx/default.conf.template`.
- The official nginx entrypoint substitutes `${API_UPSTREAM}` (default `http://api:8080`). `resolver 127.0.0.11` plus a variable `proxy_pass` resolves `api` lazily, so web starts even when api isn't up yet.
- `Host` is forwarded as `$http_host`, so springdoc's server URL matches the browser and Swagger "Try it out" works through nginx.
- nginx-generated 502/503/504 become JSON `API_UNAVAILABLE`, which `api/http.ts` shows like any `ApiError`. Error responses from the backend pass through unchanged.
- A new backend path prefix besides `/api`, `/v3` and `/swagger-ui` must be added to both the `location` regex in `nginx/default.conf.template` and the proxy in `vite.config.ts`.

## Conventions (`src/`)

- All calls go through `api/http.ts` `api()`. Pass `site` to send `X-Site` for branch endpoints, and don't pass it for `/api/master` or `/api/system`. Failures throw `ApiError`, whose `fieldErrors` are mapped onto antd form fields, and `errorText()` formats the message.
- Each endpoint gets a function in `api/endpoints.ts` and a type in `api/types.ts` that mirrors its Java record.
- `site/SiteProvider` + `useSite()` hold the selected branch, persisted in localStorage `antam.site`. **Include `site` in TanStack Query keys** for branch data (`['bac-si', site, ...]`) so that switching branches refetches.
- Deployment mode comes from the backend (`GET /api/system/mode`, see `../backend/CLAUDE.md` "Deployment modes"); `useSite().mode` is `ALL`, `BRANCH` or `HQ`. `SiteProvider` renders a skeleton until it knows the mode, so a branch app never sends another branch's `X-Site`. In `BRANCH` the site is locked to `localSite` and `setSite` does nothing; in `HQ` there is no branch data, so a hub page must not call branch endpoints there (see the replica check in `ThuocPage`, disabled for `HQ`).
- `layout/menu.tsx` defines the sidebar. `hub: true` marks pages that work against S0, which disables the branch selector. `done: true` marks real screens. Every menu entry is now done; `PlaceholderPage` only catches unknown paths. `branchApp: false` hides an entry from the branch app (chain administration), `hqApp: true` shows a non-hub entry in the HQ app (the system overview); `availableIn` / `menuFor` apply them, and `AppLayout` shows a notice instead of the page when its route isn't in the current mode.
- To add a screen: add the page in `pages/`, its route in `App.tsx`, and set `done: true` in `menu.tsx`.
- **Never import `antd` or `@ant-design/icons` outside `components/common`.** Every Ant Design component is wrapped once as a `Base*` component in `src/components/common`, grouped by function into `provider/`, `layout/`, `form/` (inputs), `table/` (table + row action buttons), `button/`, `typography/`, `display/`, `feedback/` (alerts, modals, toasts) and `icons/`; each group has an `index.ts` and the root `index.ts` re-exports them all; pages and layout import only from there (`import { BaseTable, BaseFormModal, AddIcon, useNotify } from '../components/common'`). If a screen needs an antd component that has no wrapper yet, add `BaseXxx.tsx` to the matching group folder and export it from that group's `index.ts` first. oxlint `no-restricted-imports` (`.oxlintrc.json`) enforces this.
- CRUD pages use `hooks/useCrudMutations` (`{ form, save, remove, invalidate, savedMessage, onSaved?, onDeleted? }` → `{ saveMutation, deleteMutation, saveError, setSaveError, submit, removeById }`). It maps backend `fieldErrors` onto the form, shows the HARD/SOFT delete toast and invalidates the given query keys. `YTaPage` is the template for branch CRUD screens, `BenhPage` for S0 catalogs, and `LuongPage` for monthly reports.
- Visit forms (`LuotKhamPage`, `LuotChuaPage`) share `pages/luot/`:
  - `LuotItemsEditor`: `BaseTabs` with one `BaseFormList` each for services, drugs and devices.
  - `LuotSummaryCard`: sticky total card.
  - `LuotDetailDrawer`: visit detail and delete.
  - `useLuotCatalogs`: branch catalogs.
  - `luotUtils`: totals, request mapping, `applyFieldErrors` for nested names like `chanDoan[0].maBenh`, and `LUOT_QUERY_KEYS` to invalidate after a write.
  - Long forms pass `submitOnEnter={false}` to `BaseForm`, so pressing Enter in an input or a date picker doesn't save. Use `useBaseWatch` for live totals.
  - `HoSoBenhNhanPage chain` is the chain-wide record page (`/tc-ho-so`).
- Ant Design 6 class names differ from v5. In Playwright, select tab panels by `[role=tabpanel]` and drawers / modals by `role=dialog`, not by `.ant-tabs-tabpane-active` / `.ant-drawer-content`.
- Report pages use `BaseMonthPicker` (always a `Dayjs` at the start of the month, never cleared), `BaseDateRangePicker` (`onChange` fires only when both ends are set), `BaseStatistic` cards and `BaseSummaryRow` / `BaseSummaryCell` for total rows.
- Key wrappers: `BaseFormModal` (modal + form + backend error alert, submit via `form`), `BaseTable` (`rowKey`, `unit="bác sĩ"`, default 10-row paging), `BaseColumns<T>` for column types, `BaseErrorAlert` (ApiError → message + DETAIL / SQLSTATE), `BaseEditButton` / `BaseDeleteButton` (with Popconfirm), `BaseSelect` (accepts `string[]` options), `BaseMoneyInput`, `BaseDatePicker` (`DD/MM/YYYY`, `disableFuture`), `BaseDateTimePicker` (`DD/MM/YYYY HH:mm`), `BaseCheckableTags` (multi-select chips usable as a form control), `BaseSegmented`, `BaseFormList`, `BaseTabs`, `BaseDrawer`. Use `useNotify()` instead of `App.useApp().message` and `useBaseForm<T>()` instead of `Form.useForm`. App-wide defaults (theme tokens, locale) live in `provider/BaseProvider.tsx`; icons are re-exported in `icons/index.ts` (`XxxOutlined` → `XxxIcon`).
- Stack: React 19, Ant Design 6 (wrapped in `components/common`; `vi_VN` locale set in `BaseProvider`), TanStack Query 5, React Router 8 (import from `react-router`), and dayjs. Display helpers live in `utils/format.ts`.

## Note on `.claude/`

`.claude/SKILL.md` and `.claude/references/` are a generic React skill copied from elsewhere. Where they disagree with this file or the existing code, follow this file.
