import type { TrangThaiLuongCoSo } from '../api/types'

/** Nhãn + màu tag trạng thái mức lương cơ sở — dùng chung cho màn Trung tâm và màn bản sao ở chi nhánh. */
export const TRANG_THAI_LUONG_CO_SO: Record<TrangThaiLuongCoSo, { label: string; color: string }> = {
  DANG_AP_DUNG: { label: 'Đang áp dụng', color: 'green' },
  SAP_AP_DUNG: { label: 'Sắp áp dụng', color: 'blue' },
  DA_THAY_THE: { label: 'Đã thay thế', color: 'default' },
}
