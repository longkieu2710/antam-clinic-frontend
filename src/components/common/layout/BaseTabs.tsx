import { Tabs } from 'antd'
import type { TabsProps } from 'antd'

/** Thẻ chuyển nội dung (Dịch vụ · Thuốc · Thiết bị…). Truyền `items` gồm key, label, children. */
export function BaseTabs(props: TabsProps) {
  return <Tabs {...props} />
}
