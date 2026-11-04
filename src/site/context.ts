import { createContext } from 'react'
import type { AppMode, ChiNhanh } from '../api/types'

export interface SiteContextValue {
  /** Bản triển khai: ALL chọn chi nhánh tự do · BRANCH khoá vào trạm của cơ sở · HQ chỉ làm việc với S0 */
  mode: AppMode
  /** Trạm chi nhánh đang làm việc: S1 | S2 | S3 — gửi trong header X-Site */
  site: string
  /** Thông tin chi nhánh tương ứng (undefined khi chưa tải xong) */
  branch?: ChiNhanh
  branches: ChiNhanh[]
  loading: boolean
  error: unknown
  /** Đổi chi nhánh — chỉ có tác dụng ở bản ALL */
  setSite: (site: string) => void
}

export const SiteContext = createContext<SiteContextValue | null>(null)
