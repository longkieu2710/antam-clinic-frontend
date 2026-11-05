import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getDichVuReplica } from '../api/endpoints'
import type { DichVu } from '../api/types'
import { BaseErrorAlert, BaseSearchInput, BaseTable, BaseTag, BaseText } from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { money } from '../utils/format'

/**
 * Danh mục dịch vụ y tế tại chi nhánh — bản sao Logical Replication từ S0, chỉ xem và tìm. Thêm / sửa / xoá dịch vụ làm
 * ở máy Trung tâm (bản chi nhánh không vào được /api/master/**); đọc bản sao nên vẫn dùng được khi mất kết nối.
 */
export function DichVuChiNhanhPage() {
  const { site, branch } = useSite()
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['dich-vu-replica', site], queryFn: () => getDichVuReplica(site) })

  const tuKhoa = q.trim().toLowerCase()
  const rows = (query.data ?? []).filter(
    (d) => tuKhoa === '' || [d.maDV, d.tenDV, d.loaiDV].some((v) => v?.toLowerCase().includes(tuKhoa)),
  )

  const columns: BaseColumns<DichVu> = [
    { title: 'Mã', dataIndex: 'maDV', render: (v: string) => <code>{v}</code>, width: 90 },
    {
      title: 'Dịch vụ',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenDV}</BaseText>
          {r.loaiDV && (
            <div>
              <BaseTag color={r.loaiDV === 'Khám bệnh' ? 'blue' : 'default'}>{r.loaiDV}</BaseTag>
            </div>
          )}
        </>
      ),
    },
    { title: 'ĐVT', dataIndex: 'donViTinh', width: 80 },
    { title: 'Đơn giá', dataIndex: 'donGia', align: 'right', render: money, width: 130 },
  ]

  return (
    <>
      <PageTitle
        title="Dịch vụ y tế"
        description={`Bản sao danh mục dịch vụ và bảng giá tại ${branch?.tenCn ?? site} (Logical Replication từ S0) — chỉ xem. Thêm / sửa / xoá dịch vụ làm ở máy Trung tâm.`}
      />
      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên, loại dịch vụ…" onSearch={setQ} allowClear />
      </div>
      {query.error && <BaseErrorAlert title="Không tải được danh mục dịch vụ" error={query.error} />}
      <BaseTable<DichVu> rowKey="maDV" unit="dịch vụ" columns={columns} dataSource={rows} loading={query.isLoading} />
    </>
  )
}
