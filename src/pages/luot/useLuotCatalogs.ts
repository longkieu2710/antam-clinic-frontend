import { useQuery } from '@tanstack/react-query'
import { getBacSi, getBenhReplica, getDichVuReplica, getKhoa, getThietBi, getThuocReplica, getYTa } from '../../api/endpoints'
import { NGUNG_HOAT_DONG } from './luotUtils'
import type { Catalogs } from './luotUtils'

/**
 * Danh mục cần cho form lượt khám / chữa, đọc ở chi nhánh đang chọn: khoa, bác sĩ, y tá, thiết bị (bảng cục bộ — BR6)
 * và bản sao bệnh, dịch vụ, thuốc (Logical Replication từ S0 — đơn giá hiện tại, BR7).
 */
export function useLuotCatalogs(site: string) {
  const khoa = useQuery({ queryKey: ['khoa', site], queryFn: () => getKhoa(site) })
  const bacSi = useQuery({ queryKey: ['bac-si', site, '', ''], queryFn: () => getBacSi(site) })
  const yTa = useQuery({ queryKey: ['y-ta', site, '', ''], queryFn: () => getYTa(site) })
  const benh = useQuery({ queryKey: ['benh-replica', site], queryFn: () => getBenhReplica(site) })
  const dichVu = useQuery({ queryKey: ['dich-vu-replica', site], queryFn: () => getDichVuReplica(site) })
  const thuoc = useQuery({ queryKey: ['thuoc-replica', site], queryFn: () => getThuocReplica(site) })
  const thietBi = useQuery({ queryKey: ['thiet-bi', site, ''], queryFn: () => getThietBi(site) })

  const catalogs: Catalogs = {
    dichVu: dichVu.data ?? [],
    thuoc: thuoc.data ?? [],
    thietBi: (thietBi.data ?? []).filter((t) => t.tinhTrang !== NGUNG_HOAT_DONG),
  }
  return {
    khoa: khoa.data ?? [],
    bacSi: (bacSi.data ?? []).filter((b) => b.trangThai !== NGUNG_HOAT_DONG),
    yTa: (yTa.data ?? []).filter((y) => y.trangThai !== NGUNG_HOAT_DONG),
    benh: benh.data ?? [],
    catalogs,
    loading: [khoa, bacSi, yTa, benh, dichVu, thuoc, thietBi].some((q) => q.isLoading),
    error: [khoa, bacSi, yTa, benh, dichVu, thuoc, thietBi].find((q) => q.error)?.error ?? null,
  }
}
