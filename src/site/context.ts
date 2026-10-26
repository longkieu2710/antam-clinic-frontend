import { createContext } from 'react'
import type { ChiNhanh } from '../api/types'

export interface SiteContextValue {
  /** Trạm chi nhánh đang làm việc: S1 | S2 | S3 — gửi trong header X-Site */
  site: string
  /** Thông tin chi nhánh tương ứng (undefined khi chưa tải xong) */
  branch?: ChiNhanh
  branches: ChiNhanh[]
  loading: boolean
  error: unknown
  setSite: (site: string) => void
}

export const SiteContext = createContext<SiteContextValue | null>(null)
