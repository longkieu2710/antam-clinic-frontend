import { Card } from 'antd'
import type { CardProps } from 'antd'

/** Khối nội dung có viền, tiêu đề và vùng thao tác (extra). */
export function BaseCard(props: CardProps) {
  return <Card {...props} />
}
