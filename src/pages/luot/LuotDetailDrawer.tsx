import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { deleteLuot, getLuotChiTiet, suaLuotChua, suaLuotKham } from '../../api/endpoints'
import { errorText } from '../../api/http'
import type { ChiPhi, Luot } from '../../api/types'
import {
  ArrowLeftIcon,
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseDeleteButton,
  BaseDatePicker,
  BaseDescriptions,
  BaseDrawer,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseNumberInput,
  BaseSelect,
  BaseSkeleton,
  BaseSpace,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
  BaseTextArea,
  BaseTooltip,
  BaseWritable,
  ProfileIcon,
  RetweetIcon,
  useBaseForm,
  useBaseWatch,
  useNotify,
} from '../../components/common'
import type { BaseColumns } from '../../components/common'
import { blankToNull, dateTimeVN, dateVN, money } from '../../utils/format'
import { KHOI, LUOT_QUERY_KEYS, THUONG_DOT_KHOI, TINH_TRANG, trangThaiColor } from './luotUtils'

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

interface SuaValues {
  ketLuanKham?: string
  tinhTrangSauChua?: string | null
  ketLuanSauChua?: string
  soLanChuaCanThiet?: number | null
  ngayHenTaiKham?: Dayjs | null
}

/** Nhãn tình trạng của lần chữa chưa ghi kết quả (tình trạng nhập khi sửa lượt). */
const CHUA_CAP_NHAT = 'Chưa cập nhật'

/**
 * Ngăn kéo chi tiết một lượt: thông tin, chẩn đoán / đợt, y tá, chi phí từng khoản; sửa lượt (khám: kết luận, hẹn tái
 * khám; chữa: tình trạng — "Khỏi" kết thúc đợt —, kết luận, số lần chữa cần thiết, hẹn), xoá lượt nhập nhầm. Lượt khám
 * liệt kê các lượt chữa của những đợt mở từ nó — bấm để xem ngay trong ngăn.
 */
export function LuotDetailDrawer({ site, maLuot, onClose }: Props) {
  const navigate = useNavigate()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const form = useBaseForm<SuaValues>()
  const [suaOpen, setSuaOpen] = useState(false)
  // Lượt chữa mở từ trong ngăn — quay lại được; bỏ khi ngăn mở một lượt khác
  const [nav, setNav] = useState<{ goc: string | null; mo: string[] }>({ goc: null, mo: [] })
  const mo = nav.goc === maLuot ? nav.mo : []
  const dangXem = mo.length ? mo[mo.length - 1] : maLuot
  const xemLuot = (ma: string) => setNav({ goc: maLuot, mo: [...mo, ma] })
  const quayLai = () => setNav({ goc: maLuot, mo: mo.slice(0, -1) })

  const query = useQuery({
    queryKey: ['luot-chi-tiet', site, dangXem],
    queryFn: () => getLuotChiTiet(site, dangXem!),
    enabled: !!dangXem,
    retry: false,
  })
  const sua = useMutation({
    mutationFn: (v: SuaValues) => {
      const ngayHen = v.ngayHenTaiKham ? v.ngayHenTaiKham.format('YYYY-MM-DD') : null
      return kham
        ? suaLuotKham(site, dangXem!, { ketLuanKham: blankToNull(v.ketLuanKham), ngayHenTaiKham: ngayHen })
        : suaLuotChua(site, dangXem!, {
            tinhTrangSauChua: v.tinhTrangSauChua ?? null,
            ketLuanSauChua: blankToNull(v.ketLuanSauChua),
            soLanChuaCanThiet: v.soLanChuaCanThiet ?? null,
            ngayHenTaiKham: v.tinhTrangSauChua === KHOI ? null : ngayHen,
          })
    },
    onSuccess: (r) => {
      const dongDot = r.dotDieuTri.find((x) => x.trangThai === 'Đã khỏi')
      notify.success(
        kham ? 'Đã lưu kết luận và hẹn tái khám' : dongDot ? `Đã lưu — đợt "${dongDot.tenBenh}" kết thúc “Đã khỏi”` : 'Đã lưu kết quả lần chữa',
      )
      setSuaOpen(false)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteLuot(site, dangXem!),
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
  // Lượt chữa: "Khỏi" chỉ ở lần chữa cuối của đợt, cho lượt trong tháng hiện tại (thưởng tháng trước đã tính lương)
  const dotChua = kham ? undefined : dot[0]
  const lyDoKhongKhoi = !l || kham
    ? null
    : dotChua && l.lanThu !== dotChua.soLanDaChua
      ? `Đợt đã có lần chữa sau lần ${l.lanThu ?? '?'} — chỉ ghi “Khỏi” ở lần chữa cuối.`
      : dayjs(l.thoiGian).isBefore(dayjs().startOf('month'))
        ? 'Lượt của tháng trước — thưởng chữa khỏi đã tính vào lương, không ghi “Khỏi” được nữa.'
        : null
  const tinhTrangSua = useBaseWatch('tinhTrangSauChua', form)
  const khoiSua = tinhTrangSua === KHOI

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

  const moSua = () => {
    if (!l) return
    sua.reset()
    form.resetFields()
    form.setFieldsValue({
      ketLuanKham: l.ketLuanKham ?? '',
      tinhTrangSauChua: l.tinhTrangSauChua,
      ketLuanSauChua: l.ketLuanSauChua ?? '',
      soLanChuaCanThiet: dotChua?.soLanChuaCanThiet ?? null,
      ngayHenTaiKham: l.ngayHenTaiKham ? dayjs(l.ngayHenTaiKham) : null,
    })
    setSuaOpen(true)
  }

  const ngayLuot = kham ? 'ngày khám' : 'ngày chữa'

  const luotChuaColumns: BaseColumns<Luot> = [
    {
      title: 'Lượt chữa',
      dataIndex: 'maLuot',
      render: (v: string, r) => (
        <>
          <a onClick={() => xemLuot(v)}>
            <code>{v}</code>
          </a>
          <div className="muted">
            {r.benh} · lần {r.lanThu ?? '?'}
          </div>
        </>
      ),
    },
    { title: 'Thời gian', dataIndex: 'thoiGian', width: 130, render: (v: string) => dateTimeVN(v) },
    {
      title: 'Tình trạng sau chữa',
      render: (_, r) => (
        <>
          {r.tinhTrangSauChua ?? <span className="muted">{CHUA_CAP_NHAT}</span>}
          {r.ketLuanSauChua && <div className="muted">{r.ketLuanSauChua}</div>}
        </>
      ),
    },
    { title: 'Tiền', dataIndex: 'tongTien', align: 'right', width: 110, render: money },
  ]

  return (
    <BaseDrawer
      open={!!maLuot}
      onClose={onClose}
      title={
        l ? (
          <BaseSpace wrap>
            {mo.length > 0 && <BaseButton size="small" icon={<ArrowLeftIcon />} onClick={quayLai} aria-label="Quay lại" />}
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
            {d.suaDuoc ? (
              <BaseEditButton type="default" size="middle" onClick={moSua} />
            ) : (
              <BaseTooltip title={d.lyDoKhongSua}>
                <span>
                  <BaseEditButton type="default" size="middle" disabled />
                </span>
              </BaseTooltip>
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
              { key: 'hen', label: kham ? 'Hẹn tái khám' : 'Hẹn tái khám tiếp', children: dateVN(l.ngayHenTaiKham) },
              ...(kham
                ? [
                    { key: 'ly', label: 'Lý do khám', children: l.lyDoKham ?? '—' },
                    { key: 'tc', label: 'Triệu chứng', children: l.trieuChung ?? '—' },
                    { key: 'kl', label: 'Kết luận khám', children: l.ketLuanKham ?? '—', span: 2 },
                  ]
                : [
                    { key: 'ht', label: 'Hình thức chữa', children: d.hinhThuc.length ? d.hinhThuc.join(', ') : '—' },
                    {
                      key: 'tt',
                      label: 'Tình trạng sau chữa',
                      children: l.tinhTrangSauChua ?? <span className="muted">{CHUA_CAP_NHAT} — bấm Sửa để ghi</span>,
                    },
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
                        <BaseWritable>
                          <BaseButton
                            size="small"
                            icon={<RetweetIcon />}
                            onClick={() => go(`/luot-chua-moi?maBN=${encodeURIComponent(x.maBN)}&maCDDT=${encodeURIComponent(x.maCDDT)}`)}
                          >
                            Tạo lượt chữa
                          </BaseButton>
                        </BaseWritable>
                      )}
                    </BaseSpace>
                  </li>
                ))}
              </ul>
            )}
          </BaseCard>

          {kham && dot.length > 0 && (
            <BaseCard size="small" title={`Các lượt chữa của những đợt này (${d.luotChua.length})`} style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
              <BaseTable<Luot>
                rowKey="maLuot"
                size="small"
                columns={luotChuaColumns}
                dataSource={d.luotChua}
                pagination={false}
                locale={{ emptyText: 'Chưa có lượt chữa nào' }}
              />
            </BaseCard>
          )}

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

      <BaseFormModal<SuaValues>
        open={suaOpen}
        title={`${kham ? 'Sửa lượt khám' : `Sửa lần chữa ${l?.lanThu ?? ''}`} · ${l?.maLuot ?? ''}`}
        okText="Lưu"
        form={form}
        onSubmit={(v) => sua.mutate(v)}
        onCancel={() => setSuaOpen(false)}
        loading={sua.isPending}
        error={sua.error}
      >
        {kham ? (
          <BaseFormItem name="ketLuanKham" label="Kết luận khám" extra="Bỏ trống → ghi tên các bệnh đã chẩn đoán (hoặc “Không phát hiện bệnh”)">
            <BaseTextArea rows={3} maxLength={2000} placeholder="VD: Viêm họng cấp, theo dõi thêm" />
          </BaseFormItem>
        ) : (
          <>
            <BaseFormItem
              name="tinhTrangSauChua"
              label="Tình trạng sau chữa"
              extra={lyDoKhongKhoi ?? 'Chọn “Khỏi” để kết thúc đợt (BR10)'}
            >
              <BaseSelect
                allowClear
                placeholder={CHUA_CAP_NHAT}
                options={TINH_TRANG.map((t) => ({ value: t, label: t, disabled: t === KHOI && !!lyDoKhongKhoi }))}
              />
            </BaseFormItem>
            <BaseFormItem name="ketLuanSauChua" label="Kết luận sau chữa">
              <BaseTextArea rows={2} maxLength={2000} />
            </BaseFormItem>
            <BaseFormItem
              name="soLanChuaCanThiet"
              label="Số lần chữa cần thiết"
              extra={dotChua ? `Của cả đợt "${dotChua.tenBenh ?? dotChua.maBenh}" · đã chữa ${dotChua.soLanDaChua} lần · bác sĩ được điều chỉnh` : undefined}
              rules={[{ type: 'number', min: 1, message: 'Số lần chữa cần thiết ≥ 1 (BR8)' }]}
            >
              <BaseNumberInput min={1} precision={0} />
            </BaseFormItem>
          </>
        )}
        <BaseFormItem
          name="ngayHenTaiKham"
          label={kham ? 'Ngày hẹn tái khám' : 'Hẹn tái khám tiếp'}
          dependencies={['tinhTrangSauChua']}
          rules={[
            {
              validator: (_, v: Dayjs | null) =>
                khoiSua || !v || !l || v.isAfter(dayjs(l.thoiGian), 'day')
                  ? Promise.resolve()
                  : Promise.reject(new Error(`Ngày hẹn phải sau ${ngayLuot}`)),
            },
          ]}
        >
          <BaseDatePicker disabled={khoiSua} disabledDate={(x) => !!l && !x.isAfter(dayjs(l.thoiGian), 'day')} />
        </BaseFormItem>
        {khoiSua && dotChua && (
          <BaseAlert
            type="success"
            title="Lần chữa này kết thúc đợt điều trị"
            description={`Đợt chuyển “Đã khỏi”, ngày kết thúc = thời gian lượt, bỏ hẹn tái khám. ${dotChua.tenBS ?? dotChua.maBS} được +${money(THUONG_DOT_KHOI)} vào lương tháng ${dayjs(l?.thoiGian).format('MM/YYYY')} (F3). Sau đó các lượt của đợt không sửa được nữa — muốn sửa lại thì xoá lần chữa này (trong tháng).`}
          />
        )}
      </BaseFormModal>
    </BaseDrawer>
  )
}
