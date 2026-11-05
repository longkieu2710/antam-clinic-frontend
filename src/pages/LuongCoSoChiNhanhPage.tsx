import { useQuery } from '@tanstack/react-query'
import { getLuongCoSoReplica } from '../api/endpoints'
import type { LuongCoSo, TrangThaiLuongCoSo } from '../api/types'
import { BaseErrorAlert, BaseTable, BaseTag } from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateVN, money } from '../utils/format'
import { TRANG_THAI_LUONG_CO_SO } from './luongCoSoUtils'

/**
 * Lương cơ sở tại chi nhánh — bản sao Logical Replication từ S0 (dùng để tính lương), chỉ xem. Thêm mức mới làm ở máy
 * Trung tâm (bản chi nhánh không vào được /api/master/**); đọc bản sao nên vẫn dùng được khi mất kết nối.
 */
export function LuongCoSoChiNhanhPage() {
  const { site, branch } = useSite()
  const query = useQuery({ queryKey: ['luong-co-so-replica', site], queryFn: () => getLuongCoSoReplica(site) })

  const columns: BaseColumns<LuongCoSo> = [
    { title: 'Áp dụng từ', dataIndex: 'ngayApDung', render: (v: string) => <strong>{dateVN(v)}</strong>, width: 140 },
    { title: 'Mức lương cơ sở', dataIndex: 'mucLuong', align: 'right', render: money, width: 170 },
    { title: 'Văn bản quy định', dataIndex: 'vanBanQuyDinh', render: (v: string | null) => v ?? '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 140,
      render: (v: TrangThaiLuongCoSo) => (
        <BaseTag color={TRANG_THAI_LUONG_CO_SO[v].color}>{TRANG_THAI_LUONG_CO_SO[v].label}</BaseTag>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Lương cơ sở"
        description={`Bản sao mức lương cơ sở tại ${branch?.tenCn ?? site} (Logical Replication từ S0) — chỉ xem; lương = hệ số × mức có hiệu lực trong tháng. Thêm mức mới làm ở máy Trung tâm.`}
      />
      {query.error && <BaseErrorAlert title="Không tải được lương cơ sở" error={query.error} />}
      <BaseTable<LuongCoSo> rowKey="ngayApDung" unit="mức" columns={columns} dataSource={query.data ?? []} loading={query.isLoading} />
    </>
  )
}
