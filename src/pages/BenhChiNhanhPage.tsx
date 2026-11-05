import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getBenhReplica } from '../api/endpoints'
import type { Benh } from '../api/types'
import { BaseErrorAlert, BaseSearchInput, BaseTable, BaseTag, BaseText } from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'

/**
 * Danh mục bệnh tại chi nhánh — bản sao Logical Replication từ S0, chỉ xem và tìm. Thêm / sửa / xoá bệnh làm ở máy
 * Trung tâm (bản chi nhánh không vào được /api/master/**); đọc bản sao nên vẫn dùng được khi mất kết nối.
 */
export function BenhChiNhanhPage() {
  const { site, branch } = useSite()
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['benh-replica', site], queryFn: () => getBenhReplica(site) })

  const tuKhoa = q.trim().toLowerCase()
  const rows = (query.data ?? []).filter(
    (b) => tuKhoa === '' || [b.maBenh, b.tenBenh, b.maICD10].some((v) => v?.toLowerCase().includes(tuKhoa)),
  )

  const columns: BaseColumns<Benh> = [
    { title: 'Mã', dataIndex: 'maBenh', render: (v: string) => <code>{v}</code>, width: 90 },
    { title: 'ICD-10', dataIndex: 'maICD10', render: (v: string | null) => (v ? <BaseTag>{v}</BaseTag> : '—'), width: 100 },
    {
      title: 'Bệnh',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBenh}</BaseText>
          {r.moTa && <div className="muted">{r.moTa}</div>}
        </>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Bệnh (ICD-10)"
        description={`Bản sao danh mục bệnh tại ${branch?.tenCn ?? site} (Logical Replication từ S0) — chỉ xem. Thêm / sửa / xoá bệnh làm ở máy Trung tâm.`}
      />
      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên bệnh, mã ICD-10…" onSearch={setQ} allowClear />
      </div>
      {query.error && <BaseErrorAlert title="Không tải được danh mục bệnh" error={query.error} />}
      <BaseTable<Benh> rowKey="maBenh" unit="bệnh" columns={columns} dataSource={rows} loading={query.isLoading} />
    </>
  )
}
