import type { Dayjs } from 'dayjs'
import { ApiError } from '../../api/http'
import type { ChiTietLuotInput, DichVu, ThietBi, Thuoc } from '../../api/types'
import type { BaseFormInstance } from '../../components/common'
import { blankToNull } from '../../utils/format'

/** Dòng dịch vụ / thuốc / thiết bị đang nhập trong form (chưa chọn mã thì undefined). */
export interface DichVuRow {
  maDV?: string
  soLuong?: number
  ketQua?: string
}
export interface ThuocRow {
  maThuoc?: string
  soLuong?: number
  lieuDung?: string
}
export interface ThietBiRow {
  maTB?: string
  soLan?: number
}

/** Phần chung của form lượt khám và lượt chữa. */
export interface ChiTietFormValues {
  yTa?: string[]
  dichVu?: DichVuRow[]
  thuoc?: ThuocRow[]
  thietBi?: ThietBiRow[]
}

export interface Catalogs {
  dichVu: DichVu[]
  thuoc: Thuoc[]
  thietBi: ThietBi[]
}

export interface TienLuot {
  dichVu: number
  thuoc: number
  thietBi: number
  tong: number
}

export const MUC_DO = ['Nhẹ', 'Trung bình', 'Nặng'] as const
export const TINH_TRANG = ['Đỡ', 'Không đổi', 'Nặng hơn', 'Khỏi'] as const
export const KHOI = 'Khỏi'
export const HINH_THUC = ['Tiêm', 'Trị liệu', 'Tiểu phẫu', 'Xét nghiệm', 'Chụp chiếu', 'Dùng thuốc', 'Vật lý trị liệu', 'Khí dung']
export const LOAI_KHAM_BENH = 'Khám bệnh'
export const NGUNG_HOAT_DONG = 'Ngừng hoạt động'
export const THUONG_DOT_KHOI = 1_000_000
export const THUONG_HO_TRO = 200_000

export const trangThaiColor = (v: string | null) =>
  v === 'Đang điều trị' ? 'processing' : v === 'Đã khỏi' ? 'success' : v === 'Ngừng điều trị' ? 'default' : 'warning'

/** Các query cần tải lại sau khi thêm / xoá lượt hoặc đổi trạng thái đợt. */
export const LUOT_QUERY_KEYS = [
  ['luot'],
  ['luot-chi-tiet'],
  ['tong-quan'],
  ['ho-so'],
  ['dot-dang'],
  ['benh-nhan'],
  ['bang-luong'],
  ['doanh-thu'],
  ['thong-ke-benh'],
]

export const giaDichVu = (c: Catalogs, ma?: string) => c.dichVu.find((d) => d.maDV === ma)?.donGia ?? 0
export const giaThuoc = (c: Catalogs, ma?: string) => c.thuoc.find((t) => t.maThuoc === ma)?.donGia ?? 0
export const giaThietBi = (c: Catalogs, ma?: string) => c.thietBi.find((t) => t.maTB === ma)?.donGiaSuDung ?? 0

/** Tạm tính theo đơn giá danh mục hiện tại (backend lấy lại đơn giá lúc lưu — BR7). */
export function tinhTien(v: ChiTietFormValues, c: Catalogs): TienLuot {
  const dichVu = (v.dichVu ?? []).reduce((s, r) => s + (r?.soLuong ?? 0) * giaDichVu(c, r?.maDV), 0)
  const thuoc = (v.thuoc ?? []).reduce((s, r) => s + (r?.soLuong ?? 0) * giaThuoc(c, r?.maThuoc), 0)
  const thietBi = (v.thietBi ?? []).reduce((s, r) => s + (r?.soLan ?? 0) * giaThietBi(c, r?.maTB), 0)
  return { dichVu, thuoc, thietBi, tong: dichVu + thuoc + thietBi }
}

/** Giá trị form → phần chi tiết của request (bỏ dòng chưa chọn mã). */
export function toChiTietInput(v: ChiTietFormValues): ChiTietLuotInput {
  return {
    yTa: (v.yTa ?? []).map((maYT) => ({ maYT })),
    dichVu: (v.dichVu ?? [])
      .filter((r) => r?.maDV)
      .map((r) => ({ maDV: r.maDV!, soLuong: r.soLuong ?? 1, ketQua: blankToNull(r.ketQua) })),
    thuoc: (v.thuoc ?? [])
      .filter((r) => r?.maThuoc)
      .map((r) => ({ maThuoc: r.maThuoc!, soLuong: r.soLuong ?? 1, lieuDung: blankToNull(r.lieuDung) })),
    thietBi: (v.thietBi ?? []).filter((r) => r?.maTB).map((r) => ({ maTB: r.maTB!, soLan: r.soLan ?? 1 })),
  }
}

/** dayjs → 'yyyy-MM-ddTHH:mm:ss' theo giờ máy (backend dùng LocalDateTime, không có múi giờ). */
export const toLocalDateTime = (d: Dayjs) => d.second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss')

/** Mã lượt xem trước (BR5) — số thứ tự NNN do backend sinh khi lưu. */
export const maLuotPreview = (loai: 'K' | 'C', maKhoa?: string, maBS?: string, t?: Dayjs) =>
  `${loai}-${maKhoa ?? '{MaKhoa}'}-${maBS ?? '{MaBS}'}-${t ? t.format('YYMMDD') : 'yyMMdd'}-NNN`

/**
 * Gắn lỗi từng ô do backend trả về (fieldErrors) vào form.
 * Tên dạng "chanDoan[0].maBenh" → đường dẫn ['chanDoan', 0, 'maBenh'] của antd Form.
 */
export function applyFieldErrors<T>(form: BaseFormInstance<T>, error: unknown) {
  if (!(error instanceof ApiError) || !error.fieldErrors) return
  form.setFields(
    Object.entries(error.fieldErrors).map(([name, msg]) => ({
      name: name
        .split(/[.[\]]/)
        .filter(Boolean)
        .map((part) => (/^\d+$/.test(part) ? Number(part) : part)) as never,
      errors: [msg],
    })),
  )
}

/** Luật kiểm tra "mỗi mã chỉ một dòng" cho ô chọn trong BaseFormList. */
export const khongTrung =
  (list: string, field: string, what: string) =>
  ({ getFieldValue }: { getFieldValue: (name: string) => unknown }) => ({
    validator(_: unknown, value: string | undefined) {
      const rows = (getFieldValue(list) as Record<string, string>[] | undefined) ?? []
      return value && rows.filter((r) => r?.[field] === value).length > 1
        ? Promise.reject(new Error(`${what} bị nhập 2 lần — gộp số lượng`))
        : Promise.resolve()
    },
  })
