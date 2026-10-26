import { Tooltip } from 'antd'
import type { TooltipProps } from 'antd'

/** Chú thích hiện khi rê chuột. */
export function BaseTooltip(props: TooltipProps) {
  return <Tooltip {...props} />
}
