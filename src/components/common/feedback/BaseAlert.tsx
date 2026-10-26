import { Alert } from 'antd'
import type { AlertProps } from 'antd'

/** Khung thông báo trong trang (type = success | info | warning | error) — mặc định có icon, cách dưới 16px. */
export function BaseAlert({ showIcon = true, style, ...rest }: AlertProps) {
  return <Alert showIcon={showIcon} style={{ marginBottom: 16, ...style }} {...rest} />
}
