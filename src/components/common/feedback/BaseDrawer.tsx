import { Drawer } from 'antd'
import type { DrawerProps } from 'antd'

/** Ngăn kéo bên phải để xem chi tiết (lượt khám/chữa…) — mặc định rộng 720px, đóng lại thì huỷ nội dung. */
export function BaseDrawer({ size = 720, destroyOnHidden = true, ...rest }: DrawerProps) {
  return <Drawer size={size} destroyOnHidden={destroyOnHidden} {...rest} />
}
