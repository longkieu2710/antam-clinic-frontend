import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getBenhNhanToanChuoiHq, getChiNhanhCoHoSo } from '../api/endpoints'
import type { BenhNhanTomTat } from '../api/types'
import { BaseButton, BaseErrorAlert, BaseSearchInput, BaseTable, BaseTag, BaseText, ProfileIcon } from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useTenChiNhanh } from '../site/useTenChiNhanh'
import { age, dateVN } from '../utils/format'

/**
 * Bệnh nhân của cả chuỗi ở máy Trung tâm (chỉ xem): view toàn cục BENH_NHAN ở S0, kèm các chi nhánh đang có hồ sơ —
 * một người có thể có hồ sơ ở nhiều chi nhánh (cùng mã). Hồ sơ khám chữa xem ở "Hồ sơ BN toàn chuỗi".
 */
export function BenhNhanToanChuoi() {
  const navigate = useNavigate()
  const tenCn = useTenChiNhanh()
  const [q, setQ] = useState('')
  const listQuery = useQuery({ queryKey: ['benh-nhan-tc', q], queryFn: () => getBenhNhanToanChuoiHq(q) })
  const rows = listQuery.data ?? []
  const coHoSo = useQuery({
    queryKey: ['co-ho-so', rows.map((r) => r.maBN).join(',')],
    queryFn: () => getChiNhanhCoHoSo(rows.map((r) => r.maBN)),
    enabled: rows.length > 0,
  })

  const columns: BaseColumns<BenhNhanTomTat> = [
    { title: 'Mã BN', dataIndex: 'maBN', width: 130, render: (v: string) => <code>{v}</code> },
    {
      title: 'Họ tên',
      render: (_, p) => (
        <>
          <BaseText strong>{p.hoTen}</BaseText>
          <div className="muted">
            {[p.gioiTinh, p.ngaySinh && `${dateVN(p.ngaySinh)} (${age(p.ngaySinh)} tuổi)`, p.soDienThoai].filter(Boolean).join(' · ')}
          </div>
        </>
      ),
    },
    { title: 'CCCD', dataIndex: 'cccd', width: 150, render: (v: string | null) => <code>{v ?? '—'}</code> },
    {
      title: 'Có hồ sơ tại',
      key: 'cn',
      width: 220,
      render: (_, p) =>
        coHoSo.isLoading ? '…' : (coHoSo.data?.[p.maBN] ?? []).map((cn) => <BaseTag key={cn}>{tenCn(cn)}</BaseTag>),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, p) => (
        <BaseButton size="small" icon={<ProfileIcon />} onClick={() => navigate(`/tc-ho-so?maBN=${encodeURIComponent(p.maBN)}`)}>
          Hồ sơ
        </BaseButton>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Bệnh nhân"
        description="Bệnh nhân của cả chuỗi — view toàn cục BENH_NHAN ở S0 (postgres_fdw), chỉ xem. Một người có thể có hồ sơ ở nhiều chi nhánh với cùng mã."
      />
      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, họ tên, CCCD, số điện thoại…" onSearch={setQ} allowClear />
      </div>
      {listQuery.error && <BaseErrorAlert title="Không tải được bệnh nhân toàn chuỗi" error={listQuery.error} />}
      {coHoSo.error && <BaseErrorAlert title="Không đọc được chi nhánh có hồ sơ" error={coHoSo.error} />}
      <BaseTable<BenhNhanTomTat> rowKey="maBN" unit="bệnh nhân" columns={columns} dataSource={rows} loading={listQuery.isLoading} />
    </>
  )
}
