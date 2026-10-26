import { Tag } from 'antd'
import type { TagProps } from 'antd'

/** Nhãn nhỏ có màu (trạng thái, trạm CSDL…). color: green, orange, red, blue, default… */
export function BaseTag(props: TagProps) {
  return <Tag {...props} />
}
