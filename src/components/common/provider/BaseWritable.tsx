import type { ReactNode } from 'react'
import { useBaseReadOnly } from './readOnlyContext'

/** Chỉ hiện children khi được ghi — bọc nút "Thêm…", "Tạo lượt…". */
export function BaseWritable({ children }: { children: ReactNode }) {
  return useBaseReadOnly() ? null : <>{children}</>
}
