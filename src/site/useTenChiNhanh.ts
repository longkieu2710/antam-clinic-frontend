import { useSite } from './useSite'

/** Tên ngắn của chi nhánh theo mã (CN1 → Cầu Giấy) — cột "Chi nhánh" khi Trung tâm xem toàn chuỗi. */
export function useTenChiNhanh(): (maCn: string | null | undefined) => string {
  const { branches } = useSite()
  return (maCn) => branches.find((b) => b.maCn === maCn)?.shortName ?? maCn ?? '—'
}
