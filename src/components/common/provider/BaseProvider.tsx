import { App, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import type { ReactNode } from 'react'

dayjs.locale('vi')

/** Theme chung của ứng dụng — đổi màu chủ đạo, bo góc… tại đây. */
const THEME: ThemeConfig = {
  token: { colorPrimary: '#1677ff', borderRadius: 6 },
}

/**
 * Bọc toàn bộ ứng dụng (dùng 1 lần trong main.tsx):
 * ngôn ngữ tiếng Việt, theme chung, ngữ cảnh cho thông báo {@link useNotify}.
 */
export function BaseProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={viVN} theme={THEME}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
