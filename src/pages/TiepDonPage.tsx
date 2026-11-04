import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { tiepDon } from '../api/endpoints'
import type { BenhNhanTiepDon } from '../api/types'
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
import { age, dateVN, gomTheoMa } from '../utils/format'

/**
 * Tiếp đón: tìm hồ sơ tại chi nhánh (mã, họ tên, CCCD, thẻ BHYT, số điện thoại) rồi tạo lượt khám / lượt chữa.
 * Bệnh nhân từng khám ở chi nhánh khác: nhập đúng số CCCD / thẻ BHYT, backend hỏi hàm tim_ma_benh_nhan ở S0 — chỉ trả mã
 * cũ và chi nhánh đã lập hồ sơ, không kèm thông tin cá nhân. Chi nhánh lập hồ sơ của mình với mã đó từ giấy tờ bệnh nhân.
 */
export function TiepDonPage() {
  const { site, branch } = useSite()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''

  const search = useQuery({
    queryKey: ['tiep-don', site, q],
    queryFn: () => tiepDon(site, q),
    enabled: q.trim() !== '',
    retry: false,
  })
  const rows = search.data?.taiChiNhanh ?? []
  const noiKhac = search.data?.noiKhac ?? []
  const tenCn = branch?.shortName ?? site

  /** Sang màn Bệnh nhân, mở sẵn form thêm; điền mã cũ (nếu có) và số định danh vừa tra */
  const lapHoSo = (maBN?: string) => {
    const p = new URLSearchParams({ them: '1' })
    if (maBN) p.set('maBN', maBN)
    if (search.data?.daTraToanChuoi) p.set(/^\d{12}$/.test(q) ? 'cccd' : 'soTheBHYT', q)
    navigate(`/benh-nhan?${p.toString()}`)
  }

  const columns: BaseColumns<BenhNhanTiepDon> = [
    { title: 'Mã BN', dataIndex: 'maBN', width: 120, render: (v: string) => <code>{v}</code> },
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
          <BaseButton size="small" icon={<ProfileIcon />} onClick={() => navigate(`/ho-so?maBN=${encodeURIComponent(p.maBN)}`)}>
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
        description={`Tìm hồ sơ tại ${tenCn}, rồi tạo lượt khám hoặc lượt chữa. Bệnh nhân từng khám ở chi nhánh khác: nhập đúng số CCCD / thẻ BHYT để dùng lại mã cũ.`}
      />

      <BaseCard style={{ marginBottom: 16 }}>
        <BaseSearchInput
          size="large"
          allowClear
          defaultValue={q}
          placeholder="Mã, họ tên, số điện thoại — hoặc đúng số CCCD / thẻ BHYT…"
          enterButton="Tra cứu"
          onSearch={(v) => setParams(v.trim() ? { q: v.trim() } : {})}
          style={{ maxWidth: 680 }}
          aria-label="Từ khoá tra cứu"
        />
        <div className="muted" style={{ marginTop: 8 }}>
          Họ tên, số điện thoại chỉ tìm trong hồ sơ của chi nhánh. Số CCCD / thẻ BHYT đầy đủ được tra thêm trên toàn chuỗi qua hàm{' '}
          <code>tim_ma_benh_nhan</code> ở S0 — chỉ trả mã bệnh nhân, không trả họ tên, địa chỉ hay bệnh sử của chi nhánh khác.
        </div>
      </BaseCard>

      {search.error && <BaseErrorAlert title="Không tra cứu được" error={search.error} />}
      {search.data?.canhBao && <BaseAlert type="warning" style={{ marginBottom: 12 }} title={search.data.canhBao} />}

      {gomTheoMa(noiKhac).map(([maBN, chiNhanh]) => (
        <BaseAlert
          key={maBN}
          type="success"
          style={{ marginBottom: 12 }}
          title={`Số ${q} đã có mã ${maBN} (có hồ sơ tại chi nhánh ${chiNhanh.join(', ')})`}
          description={`Lập hồ sơ tại ${tenCn} với mã này — họ tên, ngày sinh, địa chỉ… nhập từ giấy tờ bệnh nhân đưa.`}
          action={
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => lapHoSo(maBN)}>
              Lập hồ sơ với mã này
            </BaseButton>
          }
        />
      ))}

      {q && search.isSuccess && rows.length === 0 && noiKhac.length === 0 && (
        <BaseCard>
          <BaseEmpty
            description={
              search.data.daTraToanChuoi
                ? `Số “${q}” chưa có ở chi nhánh nào trong chuỗi.`
                : `Không thấy hồ sơ khớp “${q}” tại ${tenCn}. Bệnh nhân từng khám nơi khác: nhập đúng số CCCD / thẻ BHYT.`
            }
          >
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => lapHoSo()}>
              Thêm bệnh nhân mới
            </BaseButton>
          </BaseEmpty>
        </BaseCard>
      )}

      {rows.length > 0 && (
        <BaseCard title={`Hồ sơ tại ${tenCn} · ${rows.length} bệnh nhân`} styles={{ body: { padding: 0 } }}>
          <BaseTable<BenhNhanTiepDon> rowKey="maBN" unit="bệnh nhân" columns={columns} dataSource={rows} scroll={{ x: 1050 }} pagination={false} />
        </BaseCard>
      )}
    </>
  )
}
