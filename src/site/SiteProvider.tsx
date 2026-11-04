import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { getAppMode, getChiNhanh, getChiNhanhCucBo } from '../api/endpoints'
import { BaseSkeleton } from '../components/common'
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
 * Bản triển khai lấy từ /api/system/mode: bản chi nhánh (BRANCH) khoá vào trạm của cơ sở, không cho chọn chi nhánh khác;
 * bản Trung tâm (HQ) chọn được chi nhánh để xem.
 * Danh sách chi nhánh: bản chi nhánh đọc bản sao CHI_NHANH tại chỗ (/api/chi-nhanh — không cần S0), bản khác đọc
 * /api/master/chi-nhanh ở S0 (S0 tắt thì backend trả tên trạm từ cấu hình).
 */
export function SiteProvider({ children }: { children: ReactNode }) {
  // Không có /api/system/mode (backend cũ / không gọi được) → coi như bản ALL như trước
  const modeQuery = useQuery({ queryKey: ['app-mode'], queryFn: getAppMode, staleTime: Infinity, retry: 3 })
  const [selected, setSelected] = useState<string>(readStoredSite)

  const mode = modeQuery.data?.mode ?? 'ALL'
  const lockedSite = mode === 'BRANCH' ? (modeQuery.data?.localSite ?? undefined) : undefined
  const branchesQuery = useQuery({
    queryKey: ['chi-nhanh', lockedSite ?? 'S0'],
    queryFn: () => (lockedSite ? getChiNhanhCucBo(lockedSite) : getChiNhanh()),
    staleTime: 60_000,
    enabled: !modeQuery.isPending,
  })

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
    const current = lockedSite ?? selected
    const branch = branches.find((b) => b.site === current) ?? (lockedSite ? undefined : branches[0])
    return {
      mode,
      site: branch?.site ?? current,
      branch,
      branches,
      loading: branchesQuery.isLoading,
      error: branchesQuery.error,
      setSite: lockedSite ? () => {} : setSite,
    }
  }, [mode, lockedSite, branchesQuery.data, branchesQuery.isLoading, branchesQuery.error, selected, setSite])

  // Chờ biết bản triển khai trước khi render: bản chi nhánh không được gửi X-Site của chi nhánh khác dù chỉ một lần
  if (modeQuery.isPending) return <BaseSkeleton style={{ padding: 24 }} paragraph={{ rows: 6 }} />

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
