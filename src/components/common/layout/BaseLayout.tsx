import { Layout } from 'antd'
import type { LayoutProps, SiderProps } from 'antd'

/** Khung trang (bọc Sider + phần nội dung). */
export function BaseLayout(props: LayoutProps) {
  return <Layout {...props} />
}

/** Cột menu bên trái. */
export function BaseSider({ width = 236, theme = 'light', ...rest }: SiderProps) {
  return <Layout.Sider width={width} theme={theme} {...rest} />
}

/** Thanh tiêu đề trên cùng. */
export function BaseHeader(props: LayoutProps) {
  return <Layout.Header {...props} />
}

/** Vùng nội dung chính. */
export function BaseContent(props: LayoutProps) {
  return <Layout.Content {...props} />
}
