import { Skeleton } from 'antd'
import type { SkeletonProps } from 'antd'

/** Khung xám nhấp nháy trong lúc chờ dữ liệu — mặc định có hiệu ứng. */
export function BaseSkeleton({ active = true, ...rest }: SkeletonProps) {
  return <Skeleton active={active} {...rest} />
}
