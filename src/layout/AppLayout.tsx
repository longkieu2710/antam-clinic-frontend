import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  ApiIcon,
  BaseButton,
  BaseContent,
  BaseHeader,
  BaseLayout,
  BaseMenu,
  BaseSelect,
  BaseSider,
  BaseTag,
  BaseText,
  BaseTooltip,
  useNotify,
} from '../components/common'
import type { BaseMenuGroup } from '../components/common'
import { useSite } from '../site/useSite'
import { MENU, findEntry } from './menu'

const MENU_GROUPS: BaseMenuGroup[] = MENU.map((group) => ({
  key: group.label,
  label: group.label,
  items: group.items.map((item) => ({ key: item.path, icon: item.icon, label: item.label })),
}))

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const notify = useNotify()
  const { site, branch, branches, setSite, loading } = useSite()
  const [collapsed, setCollapsed] = useState(false)

  const hub = findEntry(location.pathname)?.hub ?? false

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
        <BaseMenu groups={MENU_GROUPS} selectedKey={location.pathname} onSelect={selectMenu} />
      </BaseSider>

      <BaseLayout>
        <BaseHeader className="app-header">
          <BaseText type="secondary" className="hide-sm">
            Chi nhánh đang làm việc
          </BaseText>
          <BaseTooltip title={hub ? 'Trang này luôn làm việc với Trung tâm (S0)' : undefined}>
            <BaseSelect
              value={branches.length ? site : undefined}
              placeholder="Đang tải chi nhánh…"
              loading={loading}
              disabled={hub || branches.length === 0}
              className="branch-select"
              options={branches.map((b) => ({ value: b.site, label: `${b.shortName} (${b.maCn})` }))}
              onChange={changeBranch}
              aria-label="Chi nhánh đang làm việc"
            />
          </BaseTooltip>
          <div style={{ flex: 1 }} />
          {hub ? (
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
          <Outlet />
        </BaseContent>
      </BaseLayout>
    </BaseLayout>
  )
}
