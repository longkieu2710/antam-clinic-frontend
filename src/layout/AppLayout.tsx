import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  ApiIcon,
  BaseButton,
  BaseContent,
  BaseHeader,
  BaseLayout,
  BaseMenu,
  BaseReadOnlyProvider,
  BaseResult,
  BaseSelect,
  BaseSider,
  BaseTag,
  BaseText,
  BaseTooltip,
  useNotify,
} from '../components/common'
import type { BaseMenuGroup } from '../components/common'
import { useSite } from '../site/useSite'
import { availableIn, findEntry, menuFor } from './menu'

const MODE_LABEL = { ALL: '', BRANCH: 'Bản chi nhánh', HQ: 'Bản Trung tâm' } as const
const SELECT_LABEL = { ALL: 'Chi nhánh đang làm việc', BRANCH: 'Máy chi nhánh', HQ: '' } as const

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const notify = useNotify()
  const { mode, site, branch, branches, setSite, loading } = useSite()
  const [collapsed, setCollapsed] = useState(false)

  const menuGroups = useMemo<BaseMenuGroup[]>(
    () =>
      menuFor(mode).map((group) => ({
        key: group.label,
        label: group.label,
        items: group.items.map((item) => ({ key: item.path, icon: item.icon, label: item.label })),
      })),
    [mode],
  )
  const entry = findEntry(location.pathname)
  const hub = entry?.hub ?? false
  const unavailable = entry != null && !availableIn(entry, mode)
  // Trung tâm xem danh mục của cả chuỗi: ẩn thêm / sửa / xoá (backend chỉ cho đọc)
  const readOnly = mode === 'HQ' && !hub
  // Máy Trung tâm đọc mọi thứ ở S0 (danh mục chi nhánh qua view toàn cục)
  const dbS0 = (hub || mode === 'HQ') && !unavailable
  const selectTooltip =
    mode === 'BRANCH'
      ? 'Máy này là chi nhánh cố định — đổi ở dòng app.may-nay trong application.yml'
      : hub
        ? 'Trang này luôn làm việc với Trung tâm (S0)'
        : undefined

  const changeBranch = (value: string) => {
    setSite(value)
    const target = branches.find((b) => b.site === value)
    notify.info(`Đang làm việc tại ${target?.tenCn ?? value} — mọi API gửi X-Site: ${value}`)
  }

  const selectMenu = (path: string) => {
    navigate(path)
    // Màn hình hẹp: menu đè lên nội dung → đóng lại sau khi chọn
    if (window.matchMedia('(max-width: 991px)').matches) setCollapsed(true)
  }

  return (
    <BaseLayout style={{ minHeight: '100vh' }}>
      <BaseSider breakpoint="lg" collapsedWidth={0} collapsed={collapsed} onCollapse={setCollapsed} className="app-sider">
        <div className="logo">
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" aria-hidden="true">
              <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
            </svg>
          </span>
          <div>
            An Tâm Clinic
            <small>Chuỗi phòng khám tư nhân</small>
          </div>
        </div>
        <BaseMenu groups={menuGroups} selectedKey={location.pathname} onSelect={selectMenu} />
      </BaseSider>

      <BaseLayout>
        <BaseHeader className="app-header">
          {mode !== 'ALL' && <BaseTag color={mode === 'HQ' ? 'orange' : 'green'} className="hide-sm">{MODE_LABEL[mode]}</BaseTag>}
          {mode !== 'HQ' && (
            <>
              <BaseText type="secondary" className="hide-sm">
                {SELECT_LABEL[mode]}
              </BaseText>
              <BaseTooltip title={selectTooltip}>
                <BaseSelect
                  value={branches.length ? site : undefined}
                  placeholder="Đang tải chi nhánh…"
                  loading={loading}
                  disabled={mode === 'BRANCH' || hub || branches.length === 0}
                  className="branch-select"
                  options={branches.map((b) => ({ value: b.site, label: `${b.shortName} (${b.maCn})` }))}
                  onChange={changeBranch}
                  aria-label={SELECT_LABEL[mode]}
                />
              </BaseTooltip>
            </>
          )}
          {readOnly && <BaseTag color="gold">Chỉ xem</BaseTag>}
          <div style={{ flex: 1 }} />
          {dbS0 ? (
            <BaseTag color="orange">DB: S0 · Trung tâm</BaseTag>
          ) : (
            <BaseTag color="green">
              DB: {site} · {branch?.shortName ?? '…'}
            </BaseTag>
          )}
          <BaseButton icon={<ApiIcon />} href="/swagger-ui.html" target="_blank" className="hide-sm">
            Swagger
          </BaseButton>
        </BaseHeader>

        <BaseContent className="app-content">
          {unavailable ? (
            <BaseResult
              status="warning"
              title={`Màn “${entry?.label}” không có trong ${MODE_LABEL[mode].toLowerCase()}`}
              subTitle={
                mode === 'BRANCH'
                  ? 'Chức năng của Trung tâm chỉ dùng ở máy Trung tâm.'
                  : 'Trung tâm chỉ xem dữ liệu chi nhánh — tiếp đón và tạo lượt làm ở máy của chi nhánh đó.'
              }
            />
          ) : (
            <BaseReadOnlyProvider readOnly={readOnly}>
              <Outlet />
            </BaseReadOnlyProvider>
          )}
        </BaseContent>
      </BaseLayout>
    </BaseLayout>
  )
}
