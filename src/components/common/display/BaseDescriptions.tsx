import { Descriptions } from 'antd'
import type { DescriptionsProps } from 'antd'

/** Danh sách cặp "nhãn: giá trị". Truyền dữ liệu qua `items`. */
export function BaseDescriptions({ size = 'small', ...rest }: DescriptionsProps) {
  return <Descriptions size={size} {...rest} />
}
