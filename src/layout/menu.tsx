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
  /** Có trong bản chi nhánh (APP_MODE=branch). Mặc định có */
  branchApp?: boolean
  /** Có trong bản Trung tâm (APP_MODE=hq). Mặc định = hub */
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
      { path: '/', label: 'Tổng quan hệ thống', icon: <DashboardIcon />, done: true, hqApp: true },
      { path: '/tong-quan', label: 'Tổng quan chi nhánh', icon: <HomeIcon />, done: true },
    ],
  },
  {
    label: 'Tiếp đón & khám chữa',
    items: [
      { path: '/tiep-don', label: 'Tiếp đón', icon: <SearchIcon />, done: true },
      { path: '/luot-kham-moi', label: 'Tạo lượt khám', icon: <FileAddIcon />, done: true },
      { path: '/luot-chua-moi', label: 'Tạo lượt chữa', icon: <RetweetIcon />, done: true },
      { path: '/luot', label: 'Danh sách lượt', icon: <ListIcon />, done: true },
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
    ],
  },
  {
    label: 'Báo cáo chi nhánh',
    items: [
      { path: '/bc-benh', label: 'Thống kê bệnh', icon: <BarChartIcon />, done: true },
      { path: '/bc-luong', label: 'Lương BS & y tá', icon: <WalletIcon />, done: true },
      { path: '/ho-so', label: 'Hồ sơ bệnh nhân', icon: <ProfileIcon />, done: true },
      { path: '/bc-doanh-thu', label: 'Doanh thu', icon: <DollarIcon />, done: true },
    ],
  },
  {
    label: 'Trung tâm · S0',
    hub: true,
    items: [
      { path: '/thuoc', label: 'Thuốc', icon: <ExperimentIcon />, hub: true, done: true },
      { path: '/benh', label: 'Bệnh (ICD-10)', icon: <HeartIcon />, hub: true, done: true },
      { path: '/dich-vu', label: 'Dịch vụ y tế', icon: <SolutionIcon />, hub: true, done: true },
      { path: '/luong-co-so', label: 'Lương cơ sở', icon: <AccountBookIcon />, hub: true, done: true, branchApp: false },
      { path: '/chi-nhanh', label: 'Chi nhánh', icon: <BankIcon />, hub: true, done: true, branchApp: false },
      { path: '/tc-doanh-thu', label: 'Doanh thu toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true, branchApp: false },
      { path: '/tc-ho-so', label: 'Hồ sơ BN toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true },
      { path: '/tc-thong-ke-benh', label: 'Thống kê bệnh toàn chuỗi', icon: <GlobalIcon />, hub: true, done: true, branchApp: false },
    ],
  },
]

export const ALL_ENTRIES = MENU.flatMap((g) => g.items)

export const findEntry = (path: string) => ALL_ENTRIES.find((e) => e.path === path)

/**
 * Màn có trong bản triển khai này không. Bản chi nhánh giữ danh mục thuốc/bệnh/dịch vụ và hồ sơ toàn chuỗi (đề bài yêu
 * cầu tại mỗi chi nhánh — cần kết nối S0), bỏ các màn quản trị chuỗi; bản Trung tâm chỉ có màn làm việc với S0.
 */
export function availableIn(entry: MenuEntry, mode: AppMode): boolean {
  if (mode === 'BRANCH') return entry.branchApp ?? true
  if (mode === 'HQ') return entry.hqApp ?? entry.hub ?? false
  return true
}

export const menuFor = (mode: AppMode): MenuGroup[] =>
  MENU.map((g) => ({ ...g, items: g.items.filter((e) => availableIn(e, mode)) })).filter((g) => g.items.length > 0)
