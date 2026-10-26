import { Progress } from 'antd'
import type { ProgressProps } from 'antd'

/** Thanh tỉ lệ (0–100%) — dùng làm biểu đồ thanh ngang đơn giản trong bảng. */
export function BaseProgress({ size = 'small', ...rest }: ProgressProps) {
  return <Progress size={size} {...rest} />
}
