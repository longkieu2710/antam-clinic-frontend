import { Route, Routes } from 'react-router'
import { AppLayout } from './layout/AppLayout'
import { BacSiPage } from './pages/BacSiPage'
import { BenhNhanPage } from './pages/BenhNhanPage'
import { BenhPage } from './pages/BenhPage'
import { ChiNhanhPage } from './pages/ChiNhanhPage'
import { DashboardPage } from './pages/DashboardPage'
import { DichVuPage } from './pages/DichVuPage'
import { DoanhThuPage } from './pages/DoanhThuPage'
import { HoSoBenhNhanPage } from './pages/HoSoBenhNhanPage'
import { KhoaPage } from './pages/KhoaPage'
import { LuongCoSoPage } from './pages/LuongCoSoPage'
import { LuongPage } from './pages/LuongPage'
import { LuotChuaPage } from './pages/LuotChuaPage'
import { LuotKhamPage } from './pages/LuotKhamPage'
import { LuotPage } from './pages/LuotPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { TcDoanhThuPage } from './pages/TcDoanhThuPage'
import { TcThongKeBenhPage } from './pages/TcThongKeBenhPage'
import { ThietBiPage } from './pages/ThietBiPage'
import { ThongKeBenhPage } from './pages/ThongKeBenhPage'
import { ThuocPage } from './pages/ThuocPage'
import { TiepDonPage } from './pages/TiepDonPage'
import { TongQuanChiNhanhPage } from './pages/TongQuanChiNhanhPage'
import { YTaPage } from './pages/YTaPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tong-quan" element={<TongQuanChiNhanhPage />} />
        {/* Tiếp đón & khám chữa (X-Site) */}
        <Route path="tiep-don" element={<TiepDonPage />} />
        <Route path="luot-kham-moi" element={<LuotKhamPage />} />
        <Route path="luot-chua-moi" element={<LuotChuaPage />} />
        <Route path="luot" element={<LuotPage />} />
        {/* Danh mục chi nhánh (X-Site) — F1 */}
        <Route path="bac-si" element={<BacSiPage />} />
        <Route path="y-ta" element={<YTaPage />} />
        <Route path="benh-nhan" element={<BenhNhanPage />} />
        <Route path="khoa" element={<KhoaPage />} />
        <Route path="thiet-bi" element={<ThietBiPage />} />
        {/* Báo cáo chi nhánh — F2..F5 */}
        <Route path="bc-benh" element={<ThongKeBenhPage />} />
        <Route path="bc-luong" element={<LuongPage />} />
        <Route path="ho-so" element={<HoSoBenhNhanPage />} />
        <Route path="bc-doanh-thu" element={<DoanhThuPage />} />
        {/* Danh mục chung tại S0 — F1 */}
        <Route path="thuoc" element={<ThuocPage />} />
        <Route path="benh" element={<BenhPage />} />
        <Route path="dich-vu" element={<DichVuPage />} />
        <Route path="luong-co-so" element={<LuongCoSoPage />} />
        <Route path="chi-nhanh" element={<ChiNhanhPage />} />
        {/* Báo cáo toàn chuỗi — /api/hq/** tại S0 */}
        <Route path="tc-doanh-thu" element={<TcDoanhThuPage />} />
        <Route path="tc-ho-so" element={<HoSoBenhNhanPage chain key="tc" />} />
        <Route path="tc-thong-ke-benh" element={<TcThongKeBenhPage />} />
        {/* Đường dẫn không có trong menu */}
        <Route path="*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  )
}
