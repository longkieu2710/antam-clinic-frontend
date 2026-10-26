import { Segmented } from 'antd'
import type { SegmentedProps } from 'antd'

type BaseSegmentedProps = Omit<SegmentedProps<string>, 'ref'>

/** Nhóm nút chọn một giá trị (tình trạng sau chữa, phạm vi…). Dùng được trong BaseFormItem. */
export function BaseSegmented(props: BaseSegmentedProps) {
  return <Segmented<string> {...props} />
}
