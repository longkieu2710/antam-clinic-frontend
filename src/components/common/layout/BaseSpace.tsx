import { Space } from 'antd'
import type { SpaceProps } from 'antd'

/** Xếp các phần tử cạnh nhau với khoảng cách đều. */
export function BaseSpace(props: SpaceProps) {
  return <Space {...props} />
}
