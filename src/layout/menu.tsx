import {
  AccountBookIcon,
  ApartmentIcon,
  BankIcon,
  BarChartIcon,
  DashboardIcon,
  DollarIcon,
  ExperimentIcon,
  FileAddIcon,
  GlobalIcon,
  HeartIcon,
  HomeIcon,
  IdCardIcon,
  ListIcon,
  MedicineBoxIcon,
  ProfileIcon,
  RetweetIcon,
  SearchIcon,
  SolutionIcon,
  TeamIcon,
  ToolIcon,
  WalletIcon,
} from '../components/common'
import type { ReactNode } from 'react'
import type { AppMode } from '../api/types'

export interface MenuEntry {
  path: string
  label: string
  icon: ReactNode
  /** Trang làm việc với trạm trung tâm S0 (không dùng chi nhánh đang chọn) */
  hub?: boolean
  /** Đã có màn hình thật; false = trang "đang phát triển" */
  done?: boolean
  /** Có trong bản chi nhánh. Mặc định: mọi màn trừ màn của Trung tâm (hub) */
  branchApp?: boolean
  /**
   * Có trong bản Trung tâm. Mặc định có — danh mục chi nhánh (bác sĩ, y tá, bệnh nhân, khoa, thiết bị) ở đó là danh sách
   * toàn chuỗi, chỉ xem. false: màn ghi (tiếp đón, tạo lượt) và màn theo từng chi nhánh (đã có bản toàn chuỗi ở nhóm S0)
   */
  hqApp?: boolean
}

export interface MenuGroup {
  label: string
  hub?: boolean
  items: MenuEntry[]
}

/** Cùng cấu trúc menu với prototype requirements/02_ui-prototype.html */
export const MENU: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { path: '/', label: 'Tổng quan hệ thống', icon: <DashboardIcon />, done: true },
      { path: '/tong-quan', label: 'Tổng quan chi nhánh', icon: <HomeIcon />, done: true, hqApp: false },
    ],
  },
  {
    label: 'Tiếp đón & khám chữa',
    items: [
      { path: '/tiep-don', label: 'Tiếp đón', icon: <SearchIcon />, done: true, hqApp: false },
      { path: '/luot-kham-moi', label: 'Tạo lượt khám', icon: <FileAddIcon />, done: true, hqApp: false },
      { path: '/luot-chua-moi', label: 'Tạo lượt chữa', icon: <RetweetIcon />, done: true, hqApp: false },
      { path: '/luot', label: 'Danh sách lượt', icon: <ListIcon />, done: true, hqApp: false },
    ],
  },
  {
    label: 'Danh mục chi nhánh',
    items: [
      { path: '/bac-si', label: 'Bác sĩ', icon: <MedicineBoxIcon />, done: true },
      { path: '/y-ta', label: 'Y tá', icon: <TeamIcon />, done: true },
      { path: '/benh-nhan', label: 'Bệnh nhân', icon: <IdCardIcon />, done: true },
      { path: '/khoa', label: 'Khoa', icon: <ApartmentIcon />, done: true },
      { path: '/thiet-bi', label: 'Thiết bị', icon: <ToolIcon />, done: true },
      { path: '/thuoc-chi-nhanh', label: 'Thuốc (bản sao)', icon: <ExperimentIcon />, done: true, hqApp: false },
    ],
  },
  {
    label: 'Báo cáo chi nhánh',
    items: [
      { path: '/bc-benh', label: 'Thống kê bệnh', icon: <BarChartIcon />, done: true, hqApp: false },
      { path: '/bc-luong', label: 'Lương BS & y tá', icon: <WalletIcon />, done: true, hqApp: false },
      { path: '/ho-so', label: 'Hồ sơ bệnh nhân', icon: <ProfileIcon />, done: true, hqApp: false },
      { path: '/bc-doanh-thu', label: 'Doanh thu', icon: <DollarIcon />, done: true, hqApp: false },
    ],
  },
  {
    label: 'Trung tâm · S0',
    hub: true,
    items: [
      { path: '/thuoc', label: 'Thuốc', icon: <ExperimentIcon />, hub: true, done: true },
      { path: '/benh', label: 'Bệnh (ICD-10)', icon: <HeartIcon />, hub: true, done: true },
      { path: '/dich-vu', label: 'Dịch vụ y tế', icon: <SolutionIcon />, hub: true, done: true },
      { path: '/luong-co-so', label: 'Lương cơ sở', icon: <AccountBookIcon />, hub: true, done: true },
      { path: '/chi-nhanh', label: 'Chi nhánh', icon: <BankIcon />, hub: true, done: true },
      { path: '/tc-doanh-thu', label: 'Doanh thu toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true },
      { path: '/tc-ho-so', label: 'Hồ sơ BN toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true },
      { path: '/tc-thong-ke-benh', label: 'Thống kê bệnh toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true },
    ],
  },
]

export const ALL_ENTRIES = MENU.flatMap((g) => g.items)

export const findEntry = (path: string) => ALL_ENTRIES.find((e) => e.path === path)

/**
 * Màn có trong bản triển khai này không. Bản chi nhánh: chỉ dữ liệu của chi nhánh đó (thuốc xem ở bản sao), không có màn
 * Trung tâm. Bản Trung tâm: màn Trung tâm + danh mục của cả chuỗi (chỉ xem), không chọn chi nhánh.
 */
export function availableIn(entry: MenuEntry, mode: AppMode): boolean {
  if (mode === 'BRANCH') return entry.branchApp ?? !entry.hub
  if (mode === 'HQ') return entry.hqApp ?? true
  return true
}

export const menuFor = (mode: AppMode): MenuGroup[] =>
  MENU.map((g) => ({ ...g, items: g.items.filter((e) => availableIn(e, mode)) })).filter((g) => g.items.length > 0)
