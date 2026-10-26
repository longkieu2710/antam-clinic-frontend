import { Empty } from 'antd'
import type { EmptyProps } from 'antd'

/** Khối "chưa có dữ liệu" kèm lời nhắc. */
export function BaseEmpty(props: EmptyProps) {
  return <Empty {...props} />
}
