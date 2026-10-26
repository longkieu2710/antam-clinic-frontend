import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { getChiNhanh } from '../api/endpoints'
import { SiteContext, type SiteContextValue } from './context'

const STORAGE_KEY = 'antam.site'

function readStoredSite(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'S1'
  } catch {
    return 'S1'
  }
}

/**
 * Giữ "chi nhánh đang làm việc" cho toàn ứng dụng.
 * Danh sách chi nhánh lấy từ /api/master/chi-nhanh (bảng CHI_NHANH ở S0 + cấu hình trạm của backend).
 */
export function SiteProvider({ children }: { children: ReactNode }) {
  const branchesQuery = useQuery({ queryKey: ['chi-nhanh'], queryFn: getChiNhanh, staleTime: 60_000 })
  const [selected, setSelected] = useState<string>(readStoredSite)

  const setSite = useCallback((site: string) => {
    setSelected(site)
    try {
      localStorage.setItem(STORAGE_KEY, site)
    } catch {
      // trình duyệt chặn localStorage: vẫn chạy được, chỉ không nhớ lựa chọn
    }
  }, [])

  const value = useMemo<SiteContextValue>(() => {
    const branches = branchesQuery.data ?? []
    const branch = branches.find((b) => b.site === selected) ?? branches[0]
    return {
      site: branch?.site ?? selected,
      branch,
      branches,
      loading: branchesQuery.isLoading,
      error: branchesQuery.error,
      setSite,
    }
  }, [branchesQuery.data, branchesQuery.isLoading, branchesQuery.error, selected, setSite])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
