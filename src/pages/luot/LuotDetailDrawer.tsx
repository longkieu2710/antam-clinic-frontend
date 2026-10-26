import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { deleteLuot, getLuotChiTiet } from '../../api/endpoints'
import { errorText } from '../../api/http'
import type { ChiPhi } from '../../api/types'
import {
  BaseButton,
  BaseCard,
  BaseDeleteButton,
  BaseDescriptions,
  BaseDrawer,
  BaseErrorAlert,
  BaseSkeleton,
  BaseSpace,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
  BaseTooltip,
  ProfileIcon,
  RetweetIcon,
  useNotify,
} from '../../components/common'
import type { BaseColumns } from '../../components/common'
import { dateTimeVN, dateVN, money } from '../../utils/format'
import { LUOT_QUERY_KEYS, trangThaiColor } from './luotUtils'

const LOAI_CHI_PHI: Record<ChiPhi['loai'], { label: string; color: string }> = {
  DICH_VU: { label: 'Dịch vụ', color: 'blue' },
  THUOC: { label: 'Thuốc', color: 'green' },
  THIET_BI: { label: 'Thiết bị', color: 'orange' },
}

interface Props {
  site: string
  maLuot: string | null
  onClose: () => void
}

/** Ngăn kéo chi tiết một lượt: thông tin, chẩn đoán / đợt, y tá, chi phí từng khoản; xoá lượt nhập nhầm. */
export function LuotDetailDrawer({ site, maLuot, onClose }: Props) {
  const navigate = useNavigate()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['luot-chi-tiet', site, maLuot],
    queryFn: () => getLuotChiTiet(site, maLuot!),
    enabled: !!maLuot,
    retry: false,
  })
  const remove = useMutation({
    mutationFn: () => deleteLuot(site, maLuot!),
    onSuccess: (r) => {
      notify.success(r.message)
      onClose()
      // không làm mới chi tiết của chính lượt vừa xoá (sẽ 404) — chỉ làm mới danh sách, báo cáo, hồ sơ
      LUOT_QUERY_KEYS.filter(([k]) => k !== 'luot-chi-tiet').forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
    onError: (e) => notify.error(errorText(e)),
  })

  const d = query.data
  const l = d?.luot
  const kham = l?.loaiLuot === 'KHAM'
  const dot = d?.dotDieuTri ?? []

  const columns: BaseColumns<ChiPhi> = [
    { title: 'Loại', dataIndex: 'loai', width: 100, render: (v: ChiPhi['loai']) => <BaseTag color={LOAI_CHI_PHI[v].color}>{LOAI_CHI_PHI[v].label}</BaseTag> },
    { title: 'Khoản', dataIndex: 'ten', render: (v: string, r) => <>{v} {r.ghiChu && <span className="muted">· {r.ghiChu}</span>}</> },
    { title: 'SL', dataIndex: 'soLuong', align: 'right', width: 60 },
    { title: 'Đơn giá áp dụng', dataIndex: 'donGia', align: 'right', render: money, width: 130 },
    { title: 'Thành tiền', dataIndex: 'thanhTien', align: 'right', render: money, width: 120 },
  ]

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <BaseDrawer
      open={!!maLuot}
      onClose={onClose}
      title={
        l ? (
          <BaseSpace wrap>
            <BaseTag color={kham ? 'blue' : 'purple'}>{kham ? 'Lượt khám' : `Lần chữa ${l.lanThu ?? '?'}`}</BaseTag>
            <code>{l.maLuot}</code>
          </BaseSpace>
        ) : (
          'Chi tiết lượt'
        )
      }
      extra={
        d && (
          <BaseSpace>
            {l?.maBN && (
              <BaseButton icon={<ProfileIcon />} onClick={() => go(`/ho-so?maBN=${encodeURIComponent(l.maBN!)}`)}>
                Hồ sơ
              </BaseButton>
            )}
            {d.xoaDuoc ? (
              <BaseDeleteButton
                title="Xoá lượt nhập nhầm?"
                description={kham ? 'Xoá kèm các đợt điều trị mở từ lượt khám này, y tá hỗ trợ và chi phí.' : 'Xoá kèm hình thức chữa, y tá hỗ trợ và chi phí.'}
                onConfirm={() => remove.mutate()}
              />
            ) : (
              <BaseTooltip title={d.lyDoKhongXoa}>
                <span>
                  <BaseDeleteButton title="" disabled onConfirm={() => undefined} />
                </span>
              </BaseTooltip>
            )}
          </BaseSpace>
        )
      }
    >
      {query.error && <BaseErrorAlert title="Không tải được lượt" error={query.error} />}
      {query.isLoading && <BaseSkeleton paragraph={{ rows: 8 }} />}
      {d && l && (
        <>
          <BaseDescriptions
            column={{ xs: 1, sm: 2 }}
            size="small"
            items={[
              { key: 'tg', label: 'Thời gian', children: dateTimeVN(l.thoiGian) },
              { key: 'bn', label: 'Bệnh nhân', children: l.tenBN ? `${l.tenBN} (${l.maBN})` : (l.maBN ?? '—') },
              { key: 'khoa', label: 'Khoa', children: l.tenKhoa ?? l.maKhoa },
              { key: 'bs', label: 'Bác sĩ', children: l.tenBS ?? l.maBS },
              {
                key: 'yt',
                label: 'Y tá hỗ trợ',
                children: d.yTa.length ? d.yTa.map((y) => `${y.hoTen ?? y.maYT}${y.vaiTro ? ` (${y.vaiTro})` : ''}`).join(', ') : '—',
              },
              { key: 'hen', label: 'Hẹn tái khám', children: dateVN(l.ngayHenTaiKham) },
              ...(kham
                ? [
                    { key: 'ly', label: 'Lý do khám', children: l.lyDoKham ?? '—' },
                    { key: 'tc', label: 'Triệu chứng', children: l.trieuChung ?? '—' },
                    { key: 'kl', label: 'Kết luận khám', children: l.ketLuanKham ?? '—', span: 2 },
                  ]
                : [
                    { key: 'ht', label: 'Hình thức chữa', children: d.hinhThuc.length ? d.hinhThuc.join(', ') : '—' },
                    { key: 'tt', label: 'Tình trạng sau chữa', children: l.tinhTrangSauChua ?? '—' },
                    { key: 'kl', label: 'Kết luận sau chữa', children: l.ketLuanSauChua ?? '—', span: 2 },
                  ]),
              ...(l.ghiChu ? [{ key: 'gc', label: 'Ghi chú', children: l.ghiChu, span: 2 }] : []),
            ]}
          />

          <BaseCard
            size="small"
            title={kham ? `Chẩn đoán → đợt điều trị mở từ lượt này (${dot.length})` : 'Đợt điều trị'}
            style={{ margin: '16px 0' }}
          >
            {dot.length === 0 ? (
              <span className="muted">Không phát hiện bệnh — không mở đợt điều trị (BR13).</span>
            ) : (
              <ul className="list-plain">
                {dot.map((x) => (
                  <li key={x.maCDDT}>
                    <div>
                      <b>{x.tenBenh ?? x.maBenh}</b> {x.maICD10 && <BaseTag>{x.maICD10}</BaseTag>}
                      <div className="muted">
                        <code>{x.maCDDT}</code> · mức độ {x.mucDo ?? '—'} · đã chữa {x.soLanDaChua}/{x.soLanChuaCanThiet ?? '?'} lần
                      </div>
                    </div>
                    <BaseSpace>
                      <BaseTag color={trangThaiColor(x.trangThai)}>{x.trangThai}</BaseTag>
                      {x.trangThai === 'Đang điều trị' && (
                        <BaseButton
                          size="small"
                          icon={<RetweetIcon />}
                          onClick={() => go(`/luot-chua-moi?maBN=${encodeURIComponent(x.maBN)}&maCDDT=${encodeURIComponent(x.maCDDT)}`)}
                        >
                          Tạo lượt chữa
                        </BaseButton>
                      )}
                    </BaseSpace>
                  </li>
                ))}
              </ul>
            )}
          </BaseCard>

          <BaseTable<ChiPhi>
            rowKey={(c) => `${c.loai}-${c.ma}`}
            size="small"
            columns={columns}
            dataSource={d.chiPhi}
            pagination={false}
            locale={{ emptyText: 'Lượt này không có chi phí' }}
            summary={() =>
              d.chiPhi.length > 0 && (
                <BaseSummaryRow>
                  <BaseSummaryCell index={0} colSpan={4}>
                    <strong>Tổng tiền lượt</strong>
                  </BaseSummaryCell>
                  <BaseSummaryCell index={4} align="right">
                    <strong>{money(l.tongTien)}</strong>
                  </BaseSummaryCell>
                </BaseSummaryRow>
              )
            }
          />
        </>
      )}
    </BaseDrawer>
  )
}
