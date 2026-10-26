import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { getBenhNhan, getBenhNhanToanChuoiHq, getHoSoBenhNhan, getHoSoToanChuoi, ngungDieuTri } from '../api/endpoints'
import { errorText } from '../api/http'
import type { ChiPhi, DotDieuTri, LuotHoSo } from '../api/types'
import {
  BaseAlert,
  BaseButton,
  BaseDeleteButton,
  BaseSpace,
  EyeIcon,
  RetweetIcon,
  useNotify,
  BaseCard,
  BaseCol,
  BaseDescriptions,
  BaseEmpty,
  BaseErrorAlert,
  BaseRow,
  BaseSelect,
  BaseSkeleton,
  BaseStatistic,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
  BaseText,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { age, dateTimeVN, dateVN, money } from '../utils/format'
import { LuotDetailDrawer } from './luot/LuotDetailDrawer'
import { LUOT_QUERY_KEYS, trangThaiColor } from './luot/luotUtils'

const LOAI_CHI_PHI: Record<ChiPhi['loai'], string> = { DICH_VU: 'Dịch vụ', THUOC: 'Thuốc', THIET_BI: 'Thiết bị' }

interface Props {
  /** true: hồ sơ toàn chuỗi — /api/hq/** chạy ở S0, gộp dữ liệu 3 chi nhánh qua view toàn cục */
  chain?: boolean
}

/**
 * F4 — hồ sơ bệnh nhân: thông tin, tình trạng hiện tại (đợt "Đang điều trị", đã chữa lần thứ mấy), toàn bộ lượt
 * khám/chữa từ trước đến nay và chi phí từng lượt. Mặc định tại chi nhánh đang chọn; `chain` = toàn chuỗi (S0).
 */
export function HoSoBenhNhanPage({ chain = false }: Props) {
  const { site, branch, branches } = useSite()
  const navigate = useNavigate()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const maBN = params.get('maBN') ?? undefined
  const maLuot = params.get('ma')

  const patients = useQuery({
    queryKey: chain ? ['benh-nhan-tc'] : ['benh-nhan', site, ''],
    queryFn: () => (chain ? getBenhNhanToanChuoiHq() : getBenhNhan(site)),
  })
  const hoSo = useQuery({
    queryKey: chain ? ['ho-so', 'tc', maBN] : ['ho-so', site, maBN],
    queryFn: () => (chain ? getHoSoToanChuoi(maBN!) : getHoSoBenhNhan(site, maBN!)),
    enabled: !!maBN,
    retry: false,
  })
  const stop = useMutation({
    mutationFn: (ma: string) => ngungDieuTri(site, ma),
    onSuccess: (d) => {
      notify.warning(`Đợt "${d.tenBenh}" đã chuyển "Ngừng điều trị".`)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
    onError: (e) => notify.error(errorText(e)),
  })
  const tenCn = (maCn: string | null) => (maCn ? (branches.find((b) => b.maCn === maCn)?.shortName ?? maCn) : '—')
  const cnTag = (maCn: string | null) => <BaseTag color="geekblue">{tenCn(maCn)}</BaseTag>
  const openLuot = (ma: string) => setParams(maBN ? { maBN, ma } : { ma })

  const options = (patients.data ?? []).map((p) => ({
    value: p.maBN,
    label: `${p.maBN} · ${p.hoTen}${p.cccd ? ` · ${p.cccd}` : ''}`,
  }))

  const data = hoSo.data
  const bn = data?.benhNhan
  const dangDieuTri = (data?.dotDieuTri ?? []).filter((d) => d.trangThai === 'Đang điều trị')

  const dotColumns: BaseColumns<DotDieuTri> = [
    {
      title: 'Bệnh',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBenh ?? r.maBenh}</BaseText> {r.maICD10 && <BaseTag>{r.maICD10}</BaseTag>}
          <div className="muted">
            <code>{r.maCDDT}</code> · mức độ {r.mucDo ?? '—'}
          </div>
        </>
      ),
    },
    { title: 'Bắt đầu', dataIndex: 'ngayBatDau', render: dateTimeVN, width: 150 },
    {
      title: 'Tiến trình',
      key: 'tien-trinh',
      width: 160,
      render: (_, r) => `Đã chữa ${r.soLanDaChua} / ${r.soLanChuaCanThiet ?? '?'} lần`,
    },
    { title: 'Bác sĩ', dataIndex: 'tenBS', render: (v: string | null, r) => v ?? r.maBS },
    ...(chain ? [{ title: 'Chi nhánh', key: 'cn', width: 110, render: (_: unknown, r: DotDieuTri) => cnTag(r.maCn) }] : []),
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 150,
      render: (v: string | null, r) => (
        <>
          <BaseTag color={trangThaiColor(v)}>{v ?? '—'}</BaseTag>
          {r.quaHan && <BaseTag color="warning">Quá 30 ngày</BaseTag>}
        </>
      ),
    },
    { title: 'Kết thúc', dataIndex: 'ngayKetThuc', render: dateTimeVN, width: 150 },
  ]

  const luotColumns: BaseColumns<LuotHoSo> = [
    {
      title: 'Lượt',
      width: 170,
      render: (_, r) => (
        <>
          <BaseTag color={r.loaiLuot === 'KHAM' ? 'blue' : 'purple'}>{r.loaiLuot === 'KHAM' ? 'Khám' : `Chữa lần ${r.lanThu ?? '?'}`}</BaseTag>
          <div>{dateTimeVN(r.thoiGian)}</div>
          <div className="muted">
            <code>{r.maLuot}</code>
          </div>
          {chain && cnTag(r.maCn)}
        </>
      ),
    },
    {
      title: 'Bệnh / nội dung',
      render: (_, r) => (
        <>
          <BaseText strong>{r.benh ?? 'Không phát hiện bệnh'}</BaseText>
          <div className="muted">
            {r.loaiLuot === 'KHAM'
              ? [r.lyDoKham && `Lý do: ${r.lyDoKham}`, r.ketLuanKham && `Kết luận: ${r.ketLuanKham}`].filter(Boolean).join(' · ')
              : [r.hinhThucChua, r.ketLuanSauChua && `Kết luận: ${r.ketLuanSauChua}`].filter(Boolean).join(' · ')}
          </div>
          {r.ngayHenTaiKham && <div className="muted">Hẹn tái khám: {dateVN(r.ngayHenTaiKham)}</div>}
        </>
      ),
    },
    {
      title: 'Bác sĩ / y tá',
      width: 200,
      render: (_, r) => (
        <>
          {r.tenBS ?? r.maBS}
          <div className="muted">{r.tenKhoa ?? r.maKhoa}</div>
          {r.yTaHoTro && <div className="muted">YT: {r.yTaHoTro}</div>}
        </>
      ),
    },
    { title: 'Dịch vụ', dataIndex: 'tienDichVu', align: 'right', render: money, width: 120 },
    { title: 'Thuốc', dataIndex: 'tienThuoc', align: 'right', render: money, width: 110 },
    { title: 'Thiết bị', dataIndex: 'tienThietBi', align: 'right', render: money, width: 110 },
    { title: 'Tổng', dataIndex: 'tongTien', align: 'right', render: (v: number) => <strong>{money(v)}</strong>, width: 120 },
    ...(chain
      ? []
      : [
          {
            title: '',
            key: 'xem',
            width: 70,
            render: (_: unknown, r: LuotHoSo) => (
              <BaseButton size="small" type="link" icon={<EyeIcon />} onClick={() => openLuot(r.maLuot)} aria-label="Xem chi tiết lượt" />
            ),
          },
        ]),
  ]

  const chiPhiColumns: BaseColumns<ChiPhi> = [
    { title: 'Loại', dataIndex: 'loai', width: 100, render: (v: ChiPhi['loai']) => LOAI_CHI_PHI[v] },
    { title: 'Khoản', dataIndex: 'ten', render: (v: string, r) => <>{v} {r.ghiChu && <span className="muted">· {r.ghiChu}</span>}</> },
    { title: 'SL', dataIndex: 'soLuong', align: 'right', width: 70 },
    { title: 'Đơn giá áp dụng', dataIndex: 'donGia', align: 'right', render: money, width: 140 },
    { title: 'Thành tiền', dataIndex: 'thanhTien', align: 'right', render: money, width: 130 },
  ]

  return (
    <>
      <PageTitle
        title={chain ? 'Hồ sơ bệnh nhân toàn chuỗi' : 'Hồ sơ bệnh nhân'}
        hub={chain}
        description={
          chain
            ? 'F4 toàn chuỗi — S0 gộp lịch sử khám/chữa của bệnh nhân ở cả 3 chi nhánh qua view toàn cục (postgres_fdw); mỗi lượt gắn chi nhánh phát sinh.'
            : `F4 — lịch sử khám/chữa, tình trạng hiện tại và chi phí từng lượt của bệnh nhân tại ${branch?.tenCn ?? site}.`
        }
        extra={
          <BaseSelect
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Chọn bệnh nhân (gõ mã, họ tên, CCCD)…"
            value={maBN}
            options={options}
            loading={patients.isLoading}
            onChange={(v) => setParams(v ? { maBN: v } : {})}
            style={{ width: 360, maxWidth: '100%' }}
            aria-label="Chọn bệnh nhân"
          />
        }
      />

      {!maBN && <BaseEmpty description="Chọn một bệnh nhân để xem hồ sơ" style={{ marginTop: 48 }} />}
      {hoSo.error && <BaseErrorAlert title="Không tải được hồ sơ" error={hoSo.error} />}
      {maBN && hoSo.isLoading && <BaseSkeleton paragraph={{ rows: 8 }} />}

      {data && bn && (
        <>
          <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <BaseCol xs={24} lg={16}>
              <BaseCard title={`${bn.hoTen} · ${bn.maBN}`} style={{ height: '100%' }}>
                <BaseDescriptions
                  column={{ xs: 1, sm: 2 }}
                  items={[
                    { key: 'ns', label: 'Ngày sinh', children: `${dateVN(bn.ngaySinh)}${age(bn.ngaySinh) != null ? ` (${age(bn.ngaySinh)} tuổi)` : ''}` },
                    { key: 'gt', label: 'Giới tính', children: bn.gioiTinh ?? '—' },
                    { key: 'cccd', label: 'CCCD', children: bn.cccd ?? '—' },
                    { key: 'sdt', label: 'Điện thoại', children: bn.soDienThoai ?? '—' },
                    { key: 'bhyt', label: 'Thẻ BHYT', children: bn.soTheBHYT ?? '—' },
                    { key: 'mau', label: 'Nhóm máu', children: bn.nhomMau ?? '—' },
                    { key: 'dc', label: 'Địa chỉ', children: bn.diaChi ?? '—' },
                    { key: 'du', label: 'Tiền sử dị ứng', children: bn.tienSuDiUng ?? '—' },
                  ]}
                />
              </BaseCard>
            </BaseCol>
            <BaseCol xs={24} lg={8}>
              <BaseCard style={{ height: '100%' }}>
                <BaseStatistic title="Tổng chi phí khám chữa" value={money(data.tongChiPhi)} />
                <div className="muted" style={{ marginTop: 8 }}>
                  {data.luot.length} lượt · {data.dotDieuTri.length} đợt điều trị
                </div>
              </BaseCard>
            </BaseCol>
          </BaseRow>

          <BaseCard title="Tình trạng hiện tại" style={{ marginBottom: 16 }}>
            {dangDieuTri.length === 0 ? (
              <BaseText type="secondary">Không có bệnh đang điều trị.</BaseText>
            ) : (
              dangDieuTri.map((d) => (
                <BaseAlert
                  key={d.maCDDT}
                  type="warning"
                  title={
                    <>
                      Đang điều trị <strong>{d.tenBenh ?? d.maBenh}</strong> {d.maICD10 && `(${d.maICD10})`} · mức độ {d.mucDo ?? '—'}
                    </>
                  }
                  description={`Đã chữa ${d.soLanDaChua} / ${d.soLanChuaCanThiet ?? '?'} lần cần thiết · bác sĩ ${d.tenBS ?? d.maBS} · bắt đầu ${dateVN(d.ngayBatDau)}${
                    d.ngayHenTaiKham ? ` · hẹn tái khám ${dateVN(d.ngayHenTaiKham)}` : ''
                  }${chain ? ` · ${tenCn(d.maCn)}` : ''}${d.quaHan ? ' · quá 30 ngày chưa quay lại (BR12)' : ''}`}
                  action={
                    !chain && (
                      <BaseSpace direction="vertical" size={4}>
                        <BaseButton
                          size="small"
                          icon={<RetweetIcon />}
                          onClick={() => navigate(`/luot-chua-moi?maBN=${encodeURIComponent(d.maBN)}&maCDDT=${encodeURIComponent(d.maCDDT)}`)}
                        >
                          Tạo lượt chữa
                        </BaseButton>
                        <BaseDeleteButton
                          title={`Ngừng điều trị đợt "${d.tenBenh}"?`}
                          description="Bệnh nhân bỏ dở điều trị (BR12) — đợt kết thúc, bác sĩ không được thưởng."
                          okText="Ngừng điều trị"
                          onConfirm={() => stop.mutateAsync(d.maCDDT)}
                        >
                          Ngừng điều trị
                        </BaseDeleteButton>
                      </BaseSpace>
                    )
                  }
                  style={{ marginBottom: 8 }}
                />
              ))
            )}
          </BaseCard>

          <BaseCard title="Các đợt điều trị · CHAN_DOAN_DIEU_TRI" style={{ marginBottom: 16 }}>
            <BaseTable<DotDieuTri> rowKey="maCDDT" unit="đợt" columns={dotColumns} dataSource={data.dotDieuTri} pagination={false} scroll={{ x: 900 }} />
          </BaseCard>

          <BaseCard title="Lượt khám / chữa (mới nhất trước) — bấm ▸ để xem chi tiết chi phí">
            <BaseTable<LuotHoSo>
              rowKey="maLuot"
              unit="lượt"
              columns={luotColumns}
              dataSource={data.luot}
              scroll={{ x: 1100 }}
              expandable={{
                rowExpandable: (r) => r.chiTiet.length > 0,
                expandedRowRender: (r) => (
                  <BaseTable<ChiPhi>
                    rowKey={(c) => `${c.loai}-${c.ma}`}
                    size="small"
                    columns={chiPhiColumns}
                    dataSource={r.chiTiet}
                    pagination={false}
                  />
                ),
              }}
              summary={() =>
                data.luot.length > 0 && (
                  <BaseSummaryRow>
                    <BaseSummaryCell index={0} colSpan={7}>
                      <strong>Tổng chi phí</strong>
                    </BaseSummaryCell>
                    <BaseSummaryCell index={7} align="right">
                      <strong>{money(data.tongChiPhi)}</strong>
                    </BaseSummaryCell>
                    {!chain && <BaseSummaryCell index={8} />}
                  </BaseSummaryRow>
                )
              }
            />
          </BaseCard>
        </>
      )}

      {!chain && <LuotDetailDrawer site={site} maLuot={maLuot} onClose={() => setParams(maBN ? { maBN } : {})} />}
    </>
  )
}
