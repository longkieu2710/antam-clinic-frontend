import type { ReactNode } from 'react'
import { BaseCard } from '../../components/common'
import { money } from '../../utils/format'
import type { TienLuot } from './luotUtils'

interface Props {
  title: string
  /** các dòng đầu (bệnh nhân, đợt, y tá…) */
  head?: ReactNode
  rows?: [ReactNode, ReactNode][]
  tien: TienLuot
  actions: ReactNode
}

/** Thẻ tóm tắt ghim bên phải form lượt: thông tin chính + tạm tính tiền + nút Lưu / Huỷ. */
export function LuotSummaryCard({ title, head, rows = [], tien, actions }: Props) {
  return (
    <div className="luot-sticky">
      <BaseCard title={title} actions={[<div key="a" style={{ padding: '0 16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{actions}</div>]}>
        {head}
        {rows.map(([k, v], i) => (
          <div className="sum-row" key={i}>
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
        <div className="sum-row">
          <span>Dịch vụ &amp; nhân công</span>
          <b>{money(tien.dichVu)}</b>
        </div>
        <div className="sum-row">
          <span>Thuốc</span>
          <b>{money(tien.thuoc)}</b>
        </div>
        <div className="sum-row">
          <span>Thiết bị</span>
          <b>{money(tien.thietBi)}</b>
        </div>
        <div className="sum-row total">
          <span>Tổng tiền lượt</span>
          <span>{money(tien.tong)}</span>
        </div>
        <div className="muted">Tạm tính theo đơn giá danh mục hiện tại; đơn giá áp dụng được lưu khi bấm Lưu (BR7).</div>
      </BaseCard>
    </div>
  )
}
