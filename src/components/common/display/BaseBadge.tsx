import { Badge } from 'antd'
import type { BadgeProps } from 'antd'

/** Chấm trạng thái (status = success | error | warning | processing | default). */
export function BaseBadge(props: BadgeProps) {
  return <Badge {...props} />
}
