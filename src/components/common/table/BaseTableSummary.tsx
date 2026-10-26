import { Table } from 'antd'
import type { ComponentProps } from 'react'

type SummaryRowProps = ComponentProps<typeof Table.Summary.Row>
type SummaryCellProps = ComponentProps<typeof Table.Summary.Cell>

/** Dòng tổng cuối bảng — dùng trong prop `summary` của BaseTable. */
export function BaseSummaryRow(props: SummaryRowProps) {
  return <Table.Summary.Row {...props} />
}

/** Ô trong dòng tổng — `index` là vị trí cột (bắt đầu từ 0), `colSpan` để gộp cột. */
export function BaseSummaryCell(props: SummaryCellProps) {
  return <Table.Summary.Cell {...props} />
}
