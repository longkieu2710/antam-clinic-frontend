import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getThuocReplica } from '../api/endpoints'
import type { Thuoc } from '../api/types'
import { BaseErrorAlert, BaseSearchInput, BaseTable, BaseText } from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { money } from '../utils/format'

/**
 * Danh mục thuốc tại chi nhánh — bản sao Logical Replication từ S0, chỉ xem và tìm. Thêm / sửa / xoá thuốc làm ở máy
 * Trung tâm (bản chi nhánh không vào được /api/master/**); đọc bản sao nên vẫn dùng được khi mất kết nối.
 */
export function ThuocChiNhanhPage() {
  const { site, branch } = useSite()
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['thuoc-replica', site], queryFn: () => getThuocReplica(site) })

  const tuKhoa = q.trim().toLowerCase()
  const rows = (query.data ?? []).filter(
    (t) => tuKhoa === '' || [t.maThuoc, t.tenThuoc, t.hoatChat].some((v) => v?.toLowerCase().includes(tuKhoa)),
  )

  const columns: BaseColumns<Thuoc> = [
    { title: 'Mã', dataIndex: 'maThuoc', render: (v: string) => <code>{v}</code>, width: 90 },
    {
      title: 'Thuốc',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenThuoc}</BaseText>
          {r.hoatChat && <div className="muted">{r.hoatChat}</div>}
        </>
      ),
    },
    { title: 'ĐVT', dataIndex: 'donViTinh', width: 80 },
    { title: 'Đơn giá', dataIndex: 'donGia', align: 'right', render: money, width: 130 },
    { title: 'Hãng sản xuất', dataIndex: 'hangSX', render: (v: string | null) => v ?? '—' },
  ]

  return (
    <>
      <PageTitle
        title="Thuốc"
        description={`Bản sao danh mục thuốc tại ${branch?.tenCn ?? site} (Logical Replication từ S0) — chỉ xem. Thêm / sửa / xoá thuốc làm ở máy Trung tâm.`}
      />
      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên, hoạt chất…" onSearch={setQ} allowClear />
      </div>
      {query.error && <BaseErrorAlert title="Không tải được danh mục thuốc" error={query.error} />}
      <BaseTable<Thuoc> rowKey="maThuoc" unit="thuốc" columns={columns} dataSource={rows} loading={query.isLoading} />
    </>
  )
}
