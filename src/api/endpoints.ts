import { api } from './http'
import type {
  BacSi,
  BacSiRequest,
  BangLuong,
  Benh,
  BenhNhan,
  BenhNhanRequest,
  BenhNhanToanChuoi,
  BenhNhanTomTat,
  BenhRequest,
  ChiNhanh,
  DeleteResult,
  DichVu,
  DichVuRequest,
  DoanhThu,
  DoanhThuToanChuoi,
  DotDieuTri,
  HoSoBenhNhan,
  Khoa,
  KhoaRequest,
  LuongCoSo,
  LuongCoSoRequest,
  Luot,
  LuotChiTiet,
  LuotChuaRequest,
  LuotKhamRequest,
  SiteStatus,
  TaoLuot,
  ThietBi,
  ThietBiRequest,
  ThongKeBenh,
  ThongKeBenhToanChuoi,
  Thuoc,
  TongQuan,
  ThuocRequest,
  YTa,
  YTaRequest,
} from './types'

// ---- Hệ thống (không cần X-Site)
export const getSiteStatus = () => api<SiteStatus[]>('/api/system/sites')

// ---- Danh mục chung tại S0
export const getChiNhanh = () => api<ChiNhanh[]>('/api/master/chi-nhanh')
export const updateChiNhanh = (maCn: string, body: Pick<ChiNhanh, 'tenCn' | 'diaChi' | 'soDienThoai'>) =>
  api<unknown>(`/api/master/chi-nhanh/${encodeURIComponent(maCn)}`, { method: 'PUT', body })

export const getThuocMaster = (q?: string) => api<Thuoc[]>('/api/master/thuoc', { query: { q } })
export const createThuoc = (body: ThuocRequest) => api<Thuoc>('/api/master/thuoc', { method: 'POST', body })
export const updateThuoc = (ma: string, body: ThuocRequest) =>
  api<Thuoc>(`/api/master/thuoc/${encodeURIComponent(ma)}`, { method: 'PUT', body })
export const deleteThuoc = (ma: string) =>
  api<DeleteResult>(`/api/master/thuoc/${encodeURIComponent(ma)}`, { method: 'DELETE' })

// ---- Chi nhánh đang chọn (gửi X-Site)
export const getThuocReplica = (site: string) => api<Thuoc[]>('/api/thuoc', { site })

export const getBacSi = (site: string, q?: string, khoa?: string) =>
  api<BacSi[]>('/api/bac-si', { site, query: { q, khoa } })
export const createBacSi = (site: string, body: BacSiRequest) =>
  api<BacSi>('/api/bac-si', { site, method: 'POST', body })
export const updateBacSi = (site: string, maNV: string, body: BacSiRequest) =>
  api<BacSi>(`/api/bac-si/${encodeURIComponent(maNV)}`, { site, method: 'PUT', body })
export const deleteBacSi = (site: string, maNV: string) =>
  api<DeleteResult>(`/api/bac-si/${encodeURIComponent(maNV)}`, { site, method: 'DELETE' })

export const getYTa = (site: string, q?: string, khoa?: string) => api<YTa[]>('/api/y-ta', { site, query: { q, khoa } })
export const createYTa = (site: string, body: YTaRequest) => api<YTa>('/api/y-ta', { site, method: 'POST', body })
export const updateYTa = (site: string, maNV: string, body: YTaRequest) =>
  api<YTa>(`/api/y-ta/${encodeURIComponent(maNV)}`, { site, method: 'PUT', body })
export const deleteYTa = (site: string, maNV: string) =>
  api<DeleteResult>(`/api/y-ta/${encodeURIComponent(maNV)}`, { site, method: 'DELETE' })

export const getBenhNhan = (site: string, q?: string) => api<BenhNhan[]>('/api/benh-nhan', { site, query: { q } })
export const searchBenhNhanToanChuoi = (site: string, q: string) =>
  api<BenhNhanToanChuoi[]>('/api/benh-nhan/toan-chuoi', { site, query: { q } })
export const createBenhNhan = (site: string, body: BenhNhanRequest) =>
  api<BenhNhan>('/api/benh-nhan', { site, method: 'POST', body })
export const updateBenhNhan = (site: string, maBN: string, body: BenhNhanRequest) =>
  api<BenhNhan>(`/api/benh-nhan/${encodeURIComponent(maBN)}`, { site, method: 'PUT', body })
export const deleteBenhNhan = (site: string, maBN: string) =>
  api<DeleteResult>(`/api/benh-nhan/${encodeURIComponent(maBN)}`, { site, method: 'DELETE' })
export const getHoSoBenhNhan = (site: string, maBN: string) =>
  api<HoSoBenhNhan>(`/api/benh-nhan/${encodeURIComponent(maBN)}/ho-so`, { site })

export const getKhoa = (site: string) => api<Khoa[]>('/api/khoa', { site })
export const createKhoa = (site: string, body: KhoaRequest) => api<Khoa>('/api/khoa', { site, method: 'POST', body })
export const updateKhoa = (site: string, maKhoa: string, body: KhoaRequest) =>
  api<Khoa>(`/api/khoa/${encodeURIComponent(maKhoa)}`, { site, method: 'PUT', body })
export const deleteKhoa = (site: string, maKhoa: string) =>
  api<DeleteResult>(`/api/khoa/${encodeURIComponent(maKhoa)}`, { site, method: 'DELETE' })

export const getThietBi = (site: string, q?: string) => api<ThietBi[]>('/api/thiet-bi', { site, query: { q } })
export const createThietBi = (site: string, body: ThietBiRequest) =>
  api<ThietBi>('/api/thiet-bi', { site, method: 'POST', body })
export const updateThietBi = (site: string, maTB: string, body: ThietBiRequest) =>
  api<ThietBi>(`/api/thiet-bi/${encodeURIComponent(maTB)}`, { site, method: 'PUT', body })
export const deleteThietBi = (site: string, maTB: string) =>
  api<DeleteResult>(`/api/thiet-bi/${encodeURIComponent(maTB)}`, { site, method: 'DELETE' })

// ---- Danh mục chung tại S0 (tiếp)
export const getBenhMaster = (q?: string) => api<Benh[]>('/api/master/benh', { query: { q } })
export const createBenh = (body: BenhRequest) => api<Benh>('/api/master/benh', { method: 'POST', body })
export const updateBenh = (ma: string, body: BenhRequest) =>
  api<Benh>(`/api/master/benh/${encodeURIComponent(ma)}`, { method: 'PUT', body })
export const deleteBenh = (ma: string) => api<DeleteResult>(`/api/master/benh/${encodeURIComponent(ma)}`, { method: 'DELETE' })

export const getDichVuMaster = (q?: string) => api<DichVu[]>('/api/master/dich-vu', { query: { q } })
export const createDichVu = (body: DichVuRequest) => api<DichVu>('/api/master/dich-vu', { method: 'POST', body })
export const updateDichVu = (ma: string, body: DichVuRequest) =>
  api<DichVu>(`/api/master/dich-vu/${encodeURIComponent(ma)}`, { method: 'PUT', body })
export const deleteDichVu = (ma: string) =>
  api<DeleteResult>(`/api/master/dich-vu/${encodeURIComponent(ma)}`, { method: 'DELETE' })

export const getLuongCoSo = () => api<LuongCoSo[]>('/api/master/luong-co-so')
export const createLuongCoSo = (body: LuongCoSoRequest) => api<LuongCoSo>('/api/master/luong-co-so', { method: 'POST', body })
export const updateLuongCoSo = (ngayApDung: string, body: LuongCoSoRequest) =>
  api<LuongCoSo>(`/api/master/luong-co-so/${ngayApDung}`, { method: 'PUT', body })
export const deleteLuongCoSo = (ngayApDung: string) =>
  api<DeleteResult>(`/api/master/luong-co-so/${ngayApDung}`, { method: 'DELETE' })

// ---- Báo cáo chi nhánh (F2–F5)
/** @param thang yyyy-MM */
export const getThongKeBenh = (site: string, thang: string) =>
  api<ThongKeBenh>('/api/bao-cao/thong-ke-benh', { site, query: { thang } })
/** @param thang yyyy-MM */
export const getBangLuong = (site: string, thang: string) => api<BangLuong>('/api/bao-cao/luong', { site, query: { thang } })
/** @param tu, den yyyy-MM-dd (tính cả ngày den) */
export const getDoanhThu = (site: string, tu: string, den: string) =>
  api<DoanhThu>('/api/bao-cao/doanh-thu', { site, query: { tu, den } })

// ---- Lượt khám / chữa (X-Site)
export interface LuotFilter {
  tu?: string
  den?: string
  loai?: string
  khoa?: string
  bs?: string
  q?: string
}
export const getLuot = (site: string, f: LuotFilter) => api<Luot[]>('/api/luot', { site, query: { ...f } })
export const getLuotChiTiet = (site: string, maLuot: string) =>
  api<LuotChiTiet>(`/api/luot/${encodeURIComponent(maLuot)}`, { site })
export const deleteLuot = (site: string, maLuot: string) =>
  api<DeleteResult>(`/api/luot/${encodeURIComponent(maLuot)}`, { site, method: 'DELETE' })
export const createLuotKham = (site: string, body: LuotKhamRequest) =>
  api<TaoLuot>('/api/luot-kham', { site, method: 'POST', body })
export const createLuotChua = (site: string, body: LuotChuaRequest) =>
  api<TaoLuot>('/api/luot-chua', { site, method: 'POST', body })
export const getDotDangDieuTri = (site: string, maBN: string) =>
  api<DotDieuTri[]>(`/api/benh-nhan/${encodeURIComponent(maBN)}/dot-dang-dieu-tri`, { site })
export const ngungDieuTri = (site: string, maCDDT: string) =>
  api<DotDieuTri>(`/api/dot-dieu-tri/${encodeURIComponent(maCDDT)}/ngung`, { site, method: 'PUT' })
export const getTongQuan = (site: string) => api<TongQuan>('/api/tong-quan', { site })

// ---- Bản sao danh mục chung tại chi nhánh (đơn giá áp dụng khi lưu lượt — BR7)
export const getBenhReplica = (site: string) => api<Benh[]>('/api/benh', { site })
export const getDichVuReplica = (site: string) => api<DichVu[]>('/api/dich-vu', { site })

// ---- Toàn chuỗi (S0)
export const getBenhNhanToanChuoiHq = (q?: string) => api<BenhNhanTomTat[]>('/api/hq/benh-nhan', { query: { q } })
/** → { maBN: ['CN1', 'CN3'] } */
export const getChiNhanhCoHoSo = (ma: string[]) =>
  api<Record<string, string[]>>('/api/hq/benh-nhan/chi-nhanh', { query: { ma: ma.join(',') } })
export const getHoSoToanChuoi = (maBN: string) =>
  api<HoSoBenhNhan>(`/api/hq/benh-nhan/${encodeURIComponent(maBN)}/ho-so`)
export const getDoanhThuToanChuoi = (tu: string, den: string) =>
  api<DoanhThuToanChuoi>('/api/hq/doanh-thu', { query: { tu, den } })
export const getThongKeBenhToanChuoi = (thang: string) =>
  api<ThongKeBenhToanChuoi>('/api/hq/thong-ke-benh', { query: { thang } })
