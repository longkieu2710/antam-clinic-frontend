import { Table } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'

/** Khai báo cột cho BaseTable. */
export type BaseColumns<T> = TableColumnsType<T>

export interface BaseTableProps<T> extends TableProps<T> {
  /** Đơn vị ở dòng tổng số, vd "bác sĩ" → "12 bác sĩ" */
  unit?: string
  /** Số dòng mỗi trang (mặc định 10) */
  pageSize?: number
}

/**
 * Bảng dữ liệu chung — mặc định cỡ "middle", phân trang 10 dòng kèm tổng số.
 * Bắt buộc truyền `rowKey` (tên trường khoá chính, vd "maNV").
 */
export function BaseTable<T extends object>({ unit = 'dòng', pageSize = 10, pagination, size = 'middle', ...rest }: BaseTableProps<T>) {
  const paging: TableProps<T>['pagination'] =
    pagination === false ? false : { pageSize, showTotal: (total) => `${total} ${unit}`, ...pagination }
  return <Table<T> size={size} pagination={paging} {...rest} />
}
