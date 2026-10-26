import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { getChiNhanhCoHoSo, searchBenhNhanToanChuoi } from '../api/endpoints'
import type { BenhNhanToanChuoi } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseEmpty,
  BaseErrorAlert,
  BaseSearchInput,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  FileAddIcon,
  ProfileIcon,
  RetweetIcon,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { age, dateVN } from '../utils/format'

/**
 * Tiếp đón: tra cứu bệnh nhân trên toàn chuỗi (view TRA_CUU_BENH_NHAN_TOAN_CHUOI qua S0) để dùng lại mã cũ, rồi
 * tạo lượt khám hoặc lượt chữa. Bệnh nhân chưa có hồ sơ ở chi nhánh được chép sang khi tạo lượt.
 */
export function TiepDonPage() {
  const { site, branch, branches } = useSite()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''

  const search = useQuery({
    queryKey: ['tra-cuu', site, q],
    queryFn: () => searchBenhNhanToanChuoi(site, q),
    enabled: q.trim() !== '',
    retry: false,
  })
  const rows = search.data ?? []
  const coHoSo = useQuery({
    queryKey: ['co-ho-so', rows.map((r) => r.maBN).join(',')],
    queryFn: () => getChiNhanhCoHoSo(rows.map((r) => r.maBN)),
    enabled: rows.length > 0,
    retry: false,
  })
  const tenCn = (maCn: string) => branches.find((b) => b.maCn === maCn)?.shortName ?? maCn

  const columns: BaseColumns<BenhNhanToanChuoi> = [
    { title: 'Mã BN', dataIndex: 'maBN', width: 90, render: (v: string) => <code>{v}</code> },
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
    {
      title: 'CCCD / thẻ BHYT',
      width: 170,
      render: (_, p) => (
        <>
          <code>{p.cccd ?? '—'}</code>
          <div className="muted">
            <code>{p.soTheBHYT ?? '—'}</code>
          </div>
        </>
      ),
    },
    {
      title: 'Đã có hồ sơ tại',
      width: 170,
      render: (_, p) => {
        const list = coHoSo.data?.[p.maBN]
        if (!list) return coHoSo.isLoading ? '…' : p.coTaiChiNhanh ? <BaseTag color="green">{branch?.shortName ?? site}</BaseTag> : '—'
        return list.map((cn) => (
          <BaseTag key={cn} color={cn === branch?.maCn ? 'green' : undefined}>
            {tenCn(cn)}
          </BaseTag>
        ))
      },
    },
    {
      title: 'Đang điều trị',
      dataIndex: 'soDotDangDieuTri',
      width: 110,
      align: 'center',
      render: (v: number) => (v > 0 ? <BaseTag color="processing">{v} đợt</BaseTag> : <span className="muted">—</span>),
    },
    {
      title: '',
      key: 'actions',
      width: 310,
      align: 'right',
      render: (_, p) => (
        <BaseSpace size={4} wrap>
          <BaseButton size="small" type="primary" icon={<FileAddIcon />} onClick={() => navigate(`/luot-kham-moi?maBN=${encodeURIComponent(p.maBN)}`)}>
            Tạo lượt khám
          </BaseButton>
          {p.soDotDangDieuTri > 0 && (
            <BaseButton size="small" icon={<RetweetIcon />} onClick={() => navigate(`/luot-chua-moi?maBN=${encodeURIComponent(p.maBN)}`)}>
              Tạo lượt chữa
            </BaseButton>
          )}
          <BaseButton
            size="small"
            icon={<ProfileIcon />}
            onClick={() => navigate(p.coTaiChiNhanh ? `/ho-so?maBN=${encodeURIComponent(p.maBN)}` : `/tc-ho-so?maBN=${encodeURIComponent(p.maBN)}`)}
          >
            Hồ sơ
          </BaseButton>
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Tiếp đón"
        description="Tra cứu bệnh nhân trên toàn chuỗi để dùng lại mã cũ (không tạo trùng hồ sơ), rồi tạo lượt khám hoặc lượt chữa."
      />

      <BaseCard style={{ marginBottom: 16 }}>
        <BaseSearchInput
          size="large"
          allowClear
          defaultValue={q}
          placeholder="Nhập CCCD, số thẻ BHYT, số điện thoại, mã hoặc họ tên…"
          enterButton="Tra cứu toàn chuỗi"
          onSearch={(v) => setParams(v.trim() ? { q: v.trim() } : {})}
          style={{ maxWidth: 680 }}
          aria-label="Từ khoá tra cứu"
        />
        <div className="muted" style={{ marginTop: 8 }}>
          Khớp đúng CCCD / thẻ BHYT / số điện thoại / mã bệnh nhân, hoặc một phần họ tên. Đọc qua{' '}
          <code>TRA_CUU_BENH_NHAN_TOAN_CHUOI</code> (chi nhánh → postgres_fdw → S0 → 3 chi nhánh) nên cần cả 4 trạm đang chạy.
        </div>
      </BaseCard>

      {search.error && <BaseErrorAlert title="Không tra cứu được toàn chuỗi" error={search.error} />}

      {q && search.isSuccess && rows.length === 0 && (
        <BaseCard>
          <BaseEmpty description={`Không tìm thấy bệnh nhân khớp “${q}” trên toàn chuỗi.`}>
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => navigate('/benh-nhan?them=1')}>
              Thêm bệnh nhân mới
            </BaseButton>
          </BaseEmpty>
        </BaseCard>
      )}

      {rows.length > 0 && (
        <>
          {rows.some((p) => !p.coTaiChiNhanh) && (
            <BaseAlert
              type="info"
              style={{ marginBottom: 12 }}
              title={`Có bệnh nhân chưa có hồ sơ tại ${branch?.shortName ?? site}`}
              description={`Khi tạo lượt khám, backend chép bản ghi BENH_NHAN (giữ nguyên mã) vào ${site} trong cùng transaction — vì LAN_KHAM.MaBN tham chiếu bảng cục bộ.`}
            />
          )}
          {coHoSo.error && (
            <BaseAlert type="warning" style={{ marginBottom: 12 }} title="Không đọc được chi nhánh có hồ sơ (S0)" description="Vẫn tạo lượt được." />
          )}
          <BaseCard title={`Kết quả tra cứu toàn chuỗi · ${rows.length} bệnh nhân`} styles={{ body: { padding: 0 } }}>
            <BaseTable<BenhNhanToanChuoi> rowKey="maBN" unit="bệnh nhân" columns={columns} dataSource={rows} scroll={{ x: 1050 }} pagination={false} />
          </BaseCard>
        </>
      )}
    </>
  )
}
