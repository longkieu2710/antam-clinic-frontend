/** Kiểu dữ liệu trả về từ backend (khớp các record Java). */

export interface ChiNhanh {
  site: string // S1 | S2 | S3
  maCn: string
  tenCn: string
  shortName: string
  diaChi: string | null
  soDienThoai: string | null
  jdbcUrl: string
  /** false nếu không đọc được S0 — khi đó chỉ có tên từ cấu hình backend */
  inDatabase: boolean
}

/** Bản triển khai đang chạy (APP_MODE của backend) — cùng một source cho mọi cơ sở */
export type AppMode = 'ALL' | 'BRANCH' | 'HQ'

export interface AppModeInfo {
  /** ALL: một bản cho mọi trạm · BRANCH: bản đặt tại một cơ sở · HQ: bản Trung tâm */
  mode: AppMode
  /** Trạm của bản chi nhánh; null ở chế độ khác */
  localSite: string | null
  hubSite: string
  branchSites: string[]
}

export interface SiteStatus {
  site: string
  role: 'HUB' | 'BRANCH'
  name: string
  maCn: string | null
  jdbcUrl: string
  up: boolean
  latencyMs: number | null
  database: string | null
  counts: Record<string, number> | null
  error: string | null
}

export interface Khoa {
  maKhoa: string
  tenKhoa: string
  moTa: string | null
  maCn: string
  soNhanVien: number
  soLuot: number
}

export interface KhoaRequest {
  maKhoa?: string | null
  tenKhoa: string
  moTa?: string | null
}

export interface BacSi {
  maNV: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  diaChi: string | null
  heSoLuong: number
  ngayVaoLam: string | null
  trangThai: string | null
  maKhoa: string
  tenKhoa: string | null
  chuyenKhoa: string | null
  hocVi: string | null
  soChungChiHanhNghe: string | null
  soDienThoai: string[]
  soLuot: number
  /** chi nhánh của khoa — để phân biệt khi Trung tâm xem toàn chuỗi */
  maCn: string | null
}

export interface BacSiRequest {
  maNV?: string | null
  hoTen: string
  ngaySinh?: string | null
  gioiTinh?: string | null
  cccd?: string | null
  diaChi?: string | null
  heSoLuong: number
  ngayVaoLam?: string | null
  trangThai?: string | null
  maKhoa: string
  chuyenKhoa?: string | null
  hocVi?: string | null
  soChungChiHanhNghe?: string | null
  soDienThoai: string[]
}

export interface Thuoc {
  maThuoc: string
  tenThuoc: string
  hoatChat: string | null
  donViTinh: string
  donGia: number
  hangSX: string | null
  /** số lần được kê trên toàn chuỗi; null nếu một chi nhánh đang tắt */
  soLanKe: number | null
}

export interface ThuocRequest {
  maThuoc?: string | null
  tenThuoc: string
  hoatChat?: string | null
  donViTinh: string
  donGia: number
  hangSX?: string | null
}

export interface DeleteResult {
  mode: 'HARD' | 'SOFT'
  message: string
}

// ---------------------------------------------------------------- F1: danh mục chi nhánh

export interface YTa {
  maNV: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  diaChi: string | null
  heSoLuong: number
  ngayVaoLam: string | null
  trangThai: string | null
  maKhoa: string
  tenKhoa: string | null
  trinhDo: string | null
  soChungChiHanhNghe: string | null
  soDienThoai: string[]
  soLanHoTro: number
  /** chi nhánh của khoa — để phân biệt khi Trung tâm xem toàn chuỗi */
  maCn: string | null
}

export interface YTaRequest {
  maNV?: string | null
  hoTen: string
  ngaySinh?: string | null
  gioiTinh?: string | null
  cccd?: string | null
  diaChi?: string | null
  heSoLuong: number
  ngayVaoLam?: string | null
  trangThai?: string | null
  maKhoa: string
  trinhDo?: string | null
  soChungChiHanhNghe?: string | null
  soDienThoai: string[]
}

export interface BenhNhan {
  maBN: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  soDienThoai: string | null
  diaChi: string | null
  soTheBHYT: string | null
  nhomMau: string | null
  tienSuDiUng: string | null
  soLanKham: number
  /** ISO date-time của lần khám gần nhất */
  lanKhamGanNhat: string | null
  soDotDangDieuTri: number
}

export interface BenhNhanRequest {
  maBN?: string | null
  hoTen: string
  ngaySinh?: string | null
  gioiTinh?: string | null
  cccd?: string | null
  soDienThoai?: string | null
  diaChi?: string | null
  soTheBHYT?: string | null
  nhomMau?: string | null
  tienSuDiUng?: string | null
}

/** Bệnh nhân có hồ sơ tại chi nhánh, khi tiếp đón */
export interface BenhNhanTiepDon {
  maBN: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  soDienThoai: string | null
  soTheBHYT: string | null
  diaChi: string | null
  /** số đợt "Đang điều trị" tại chi nhánh (> 0 thì tạo được lượt chữa) */
  soDotDangDieuTri: number
}

/** Hàm tim_ma_benh_nhan ở S0: số CCCD / thẻ BHYT đã có mã ở chi nhánh nào — không kèm thông tin cá nhân */
export interface ChiMucBenhNhan {
  maBN: string
  maCn: string
  ketNoi: boolean
}

/** GET /api/benh-nhan/tiep-don */
export interface TiepDon {
  taiChiNhanh: BenhNhanTiepDon[]
  /** chỉ khi từ khoá là số CCCD / thẻ BHYT đầy đủ mà chi nhánh chưa có hồ sơ */
  noiKhac: ChiMucBenhNhan[]
  daTraToanChuoi: boolean
  canhBao: string | null
}

export interface ThietBi {
  maTB: string
  tenTB: string
  loaiTB: string | null
  donGiaSuDung: number
  ngayMua: string | null
  tinhTrang: string | null
  maCn: string
  soLanSuDung: number
}

export interface ThietBiRequest {
  maTB?: string | null
  tenTB: string
  loaiTB?: string | null
  donGiaSuDung: number
  ngayMua?: string | null
  tinhTrang?: string | null
}

// ---------------------------------------------------------------- F1: danh mục chung tại S0

export interface Benh {
  maBenh: string
  tenBenh: string
  maICD10: string | null
  moTa: string | null
  /** số đợt điều trị toàn chuỗi; null nếu một chi nhánh đang tắt */
  soLanChanDoan: number | null
}

export interface BenhRequest {
  maBenh?: string | null
  tenBenh: string
  maICD10?: string | null
  moTa?: string | null
}

export interface DichVu {
  maDV: string
  tenDV: string
  loaiDV: string | null
  donViTinh: string
  donGia: number
  /** số lần dùng toàn chuỗi; null nếu một chi nhánh đang tắt */
  soLanSuDung: number | null
}

export interface DichVuRequest {
  maDV?: string | null
  tenDV: string
  loaiDV?: string | null
  donViTinh: string
  donGia: number
}

export type TrangThaiLuongCoSo = 'DANG_AP_DUNG' | 'DA_THAY_THE' | 'SAP_AP_DUNG'

export interface LuongCoSo {
  ngayApDung: string
  mucLuong: number
  vanBanQuyDinh: string | null
  trangThai: TrangThaiLuongCoSo
}

export interface LuongCoSoRequest {
  ngayApDung: string
  mucLuong: number
  vanBanQuyDinh?: string | null
}

// ---------------------------------------------------------------- F2–F5: báo cáo chi nhánh

export interface ThongKeBenhItem {
  maBenh: string
  tenBenh: string
  maICD10: string | null
  /** số đợt điều trị có lượt khám/chữa trong tháng (lượt liên tiếp của 1 đợt = 1 lần) */
  soLanMac: number
  soBenhNhan: number
}

export interface ThongKeBenh {
  thang: string
  tongLanMac: number
  benh: ThongKeBenhItem[]
}

export interface LuongNhanVien {
  maNV: string
  hoTen: string
  loaiNV: 'BS' | 'YT'
  maKhoa: string
  tenKhoa: string | null
  trangThai: string | null
  heSoLuong: number
  luongCoBan: number
  soDotKhoi: number
  soLanHoTro: number
  thuong: number
  tongLuong: number
}

export interface BangLuong {
  thang: string
  ngayApDungLuongCoSo: string
  mucLuongCoSo: number
  thuongMoiDotKhoi: number
  thuongMoiLanHoTro: number
  tongQuyLuong: number
  nhanVien: LuongNhanVien[]
}

export interface DotDieuTri {
  maCDDT: string
  maBenh: string
  tenBenh: string | null
  maICD10: string | null
  mucDo: string | null
  soLanChuaCanThiet: number | null
  soLanDaChua: number
  trangThai: string | null
  ngayBatDau: string
  ngayKetThuc: string | null
  maLuotKham: string
  maBN: string
  tenBN: string | null
  /** bác sĩ đã khám mở đợt — mọi lần chữa của đợt do bác sĩ này thực hiện (BR2) */
  maBS: string
  tenBS: string | null
  maKhoa: string
  tenKhoa: string | null
  maCn: string | null
  lanChuaGanNhat: string | null
  /** lượt gần nhất của đợt — lần chữa mới phải sau mốc này (BR3) */
  luotGanNhat: string
  ngayHenTaiKham: string | null
  /** đang điều trị nhưng quá 30 ngày bệnh nhân không quay lại (BR12) */
  quaHan: boolean
}

export interface ChiPhi {
  maLuot: string
  loai: 'DICH_VU' | 'THUOC' | 'THIET_BI'
  ma: string
  ten: string
  ghiChu: string | null
  soLuong: number
  donGia: number
  thanhTien: number
}

export interface LuotHoSo {
  maLuot: string
  thoiGian: string
  loaiLuot: 'KHAM' | 'CHUA'
  maKhoa: string
  tenKhoa: string | null
  /** chi nhánh phát sinh lượt (dùng ở hồ sơ toàn chuỗi) */
  maCn: string | null
  maBS: string
  tenBS: string | null
  ngayHenTaiKham: string | null
  ghiChu: string | null
  lyDoKham: string | null
  trieuChung: string | null
  ketLuanKham: string | null
  maCDDT: string | null
  lanThu: number | null
  ketLuanSauChua: string | null
  tinhTrangSauChua: string | null
  benh: string | null
  hinhThucChua: string | null
  yTaHoTro: string | null
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tongTien: number
  chiTiet: ChiPhi[]
}

export interface HoSoBenhNhan {
  benhNhan: BenhNhan
  dotDieuTri: DotDieuTri[]
  luot: LuotHoSo[]
  tongChiPhi: number
}

export interface DoanhThuThang {
  thang: string
  soLuot: number
  tienKham: number
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tong: number
}

export interface DoanhThuChiTiet {
  loai: 'DICH_VU' | 'THUOC' | 'THIET_BI'
  ma: string
  ten: string
  nhom: string | null
  soLuong: number
  soTien: number
}

export interface DoanhThu {
  tu: string
  den: string
  soLuot: number
  tienKham: number
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tongDoanhThu: number
  theoThang: DoanhThuThang[]
  chiTiet: DoanhThuChiTiet[]
}

// ---- Lượt khám / chữa

/** Một lượt trong danh sách lượt của chi nhánh (LuotResponse) */
export interface Luot {
  maLuot: string
  thoiGian: string
  loaiLuot: 'KHAM' | 'CHUA'
  ngayHenTaiKham: string | null
  ghiChu: string | null
  maKhoa: string
  tenKhoa: string | null
  maBS: string
  tenBS: string | null
  maBN: string | null
  tenBN: string | null
  lyDoKham: string | null
  trieuChung: string | null
  ketLuanKham: string | null
  maCDDT: string | null
  lanThu: number | null
  ketLuanSauChua: string | null
  tinhTrangSauChua: string | null
  benh: string | null
  hinhThucChua: string | null
  yTaHoTro: string | null
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tongTien: number
}

export interface YTaHoTro {
  maYT: string
  hoTen: string | null
  vaiTro: string | null
}

export interface LuotChiTiet {
  luot: Luot
  hinhThuc: string[]
  yTa: YTaHoTro[]
  /** khám: các đợt mở từ lượt này; chữa: đợt của lần chữa */
  dotDieuTri: DotDieuTri[]
  chiPhi: ChiPhi[]
  xoaDuoc: boolean
  lyDoKhongXoa: string | null
  /** khám: các lượt chữa của những đợt mở từ lượt này, theo thời gian */
  luotChua: Luot[]
  /** khám: sửa được kết luận / hẹn tái khám — khoá khi có đợt đã khỏi hoặc ngừng điều trị */
  suaDuoc: boolean
  lyDoKhongSua: string | null
}

export interface ChanDoanInput {
  maBenh: string
  mucDo: 'Nhẹ' | 'Trung bình' | 'Nặng'
  soLanChuaCanThiet: number
}

export interface YTaHoTroInput {
  maYT: string
  vaiTro?: string | null
}

export interface DichVuDungInput {
  maDV: string
  soLuong: number
  ketQua?: string | null
}

export interface ThuocKeInput {
  maThuoc: string
  soLuong: number
  lieuDung?: string | null
}

export interface ThietBiDungInput {
  maTB: string
  soLan: number
}

export interface ChiTietLuotInput {
  yTa: YTaHoTroInput[]
  dichVu: DichVuDungInput[]
  thuoc: ThuocKeInput[]
  thietBi: ThietBiDungInput[]
}

export interface LuotKhamRequest extends ChiTietLuotInput {
  maBN: string
  maKhoa: string
  maBS: string
  /** yyyy-MM-ddTHH:mm:ss */
  thoiGian: string
  lyDoKham: string | null
  trieuChung: string | null
  ghiChu: string | null
  chanDoan: ChanDoanInput[]
}

/** PUT /api/luot-kham/{maLuot} — kết luận và hẹn tái khám nhập khi sửa lượt khám, không nhập lúc tạo */
export interface SuaLuotKhamRequest {
  /** bỏ trống = tên các bệnh đã chẩn đoán, hoặc "Không phát hiện bệnh" */
  ketLuanKham: string | null
  /** yyyy-MM-dd, sau ngày khám */
  ngayHenTaiKham: string | null
}

export interface LuotChuaRequest extends ChiTietLuotInput {
  maCDDT: string
  thoiGian: string
  hinhThuc: string[]
  ghiChu: string | null
}

/** Kết quả lần chữa, nhập khi sửa lượt chữa. */
export interface SuaLuotChuaRequest {
  /** một trong TINH_TRANG; "Khỏi" kết thúc đợt (BR10) — chỉ ở lần chữa cuối, lượt trong tháng hiện tại */
  tinhTrangSauChua: string | null
  ketLuanSauChua: string | null
  /** số lần chữa dự kiến của đợt; null = giữ nguyên */
  soLanChuaCanThiet: number | null
  /** yyyy-MM-dd, sau ngày chữa; bỏ qua khi "Khỏi" */
  ngayHenTaiKham: string | null
}

export interface TaoLuot {
  maLuot: string
  loaiLuot: 'KHAM' | 'CHUA'
  maBN: string
  tenBN: string | null
  maCDDT: string[]
  lanThu: number | null
  tongTien: number
  canhBao: string[]
}

// ---- Toàn chuỗi (S0)

export interface BenhNhanTomTat {
  maBN: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  soDienThoai: string | null
}

export interface DoanhThuChiNhanh {
  maCn: string
  tenCn: string
  soLuot: number
  tienKham: number
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tong: number
  /** % trên doanh thu toàn chuỗi */
  tyTrong: number
}

export interface DoanhThuChiNhanhThang {
  maCn: string
  thang: string
  soLuot: number
  tienKham: number
  tienDichVu: number
  tienThuoc: number
  tienThietBi: number
  tong: number
}

export interface DoanhThuToanChuoi {
  tongHop: DoanhThu
  chiNhanh: DoanhThuChiNhanh[]
  theoThangChiNhanh: DoanhThuChiNhanhThang[]
}

export interface ThongKeBenhToanChuoiItem extends ThongKeBenhItem {
  /** mã chi nhánh → số lần mắc */
  theoChiNhanh: Record<string, number>
}

export interface ThongKeBenhToanChuoi {
  thang: string
  tongLanMac: number
  chiNhanh: string[]
  tongTheoChiNhanh: Record<string, number>
  benh: ThongKeBenhToanChuoiItem[]
}

// ---- Tổng quan chi nhánh

export interface TongQuan {
  ngay: string
  khamHomNay: number
  chuaHomNay: number
  dotDangDieuTri: number
  soLuotThang: number
  doanhThuThang: number
  benhNhanMoiThang: number
  luotGanDay: Luot[]
  lichHen: DotDieuTri[]
  quaHan: DotDieuTri[]
  topBenh: ThongKeBenhItem[]
}


// ---- Hóa đơn & Thanh toán (v2 Spec)

export type TrangThaiHoaDon = 'Chưa trả' | 'Trả một phần' | 'Đã trả'

export interface HoaDonItem {
  maHD: string
  ngayLap: string
  giamTru: number
  maPhieu: string
  loaiPhieu: 'KHAM' | 'DIEU_TRI'
  tongTien: number
  soTienPhaiTra: number
  daThu: number
  conThieu: number
  trangThai: TrangThaiHoaDon
  maBN: string
  tenBN: string
  tenBS: string
  soDienThoai?: string
}

export interface LanThanhToanItem {
  stt: number
  thoiGian: string
  soTien: number
  hinhThuc: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ'
}

export interface HoaDonDetail {
  hoaDon: HoaDonItem
  lanThanhToan: LanThanhToanItem[]
  chiTietChiPhi: {
    loaiChiPhi: string
    maMatHang: string
    tenMatHang: string
    soLuong: number
    donGia: number
    thanhTien: number
  }[]
}
