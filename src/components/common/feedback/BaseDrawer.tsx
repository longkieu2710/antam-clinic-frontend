import { Drawer } from 'antd'
import type { DrawerProps } from 'antd'

/** Ngăn kéo bên phải để xem chi tiết (lượt khám/chữa…) — mặc định rộng 800px, đóng lại thì huỷ nội dung. */
export function BaseDrawer({ size, width = 800, destroyOnHidden = true, ...rest }: DrawerProps) {
  return <Drawer size={size} width={width} destroyOnHidden={destroyOnHidden} {...rest} />
}
