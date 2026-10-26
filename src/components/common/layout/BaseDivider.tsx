import { Divider } from 'antd'
import type { DividerProps } from 'antd'

/** Đường kẻ ngang có tiêu đề — dùng làm tiêu đề nhóm trường trong form. Mặc định: tiêu đề bên trái, chữ thường. */
export function BaseDivider({ titlePlacement = 'start', plain = true, ...rest }: DividerProps) {
  return <Divider titlePlacement={titlePlacement} plain={plain} {...rest} />
}
