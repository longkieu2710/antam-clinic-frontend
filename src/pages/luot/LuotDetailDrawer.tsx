import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { deleteLuot, getBenhReplica, getLuotChiTiet, suaLuotChua, suaLuotKham, themChanDoan } from '../../api/endpoints'
import { errorText } from '../../api/http'
import type { ChanDoanInput, ChiPhi, Luot } from '../../api/types'
import {
  AddIcon,
  ArrowLeftIcon,
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseCol,
  BaseDeleteButton,
  BaseDatePicker,
  BaseDescriptions,
  BaseDrawer,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseNumberInput,
  BaseRow,
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
  DollarIcon,
  ProfileIcon,
  RetweetIcon,
  useBaseForm,
  useBaseWatch,
  useNotify,
} from '../../components/common'
import type { BaseColumns } from '../../components/common'
import { blankToNull, dateTimeVN, dateVN, money } from '../../utils/format'
import { KHOI, LUOT_QUERY_KEYS, MUC_DO, THUONG_DOT_KHOI, TINH_TRANG, trangThaiColor } from './luotUtils'

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
  const formThemDot = useBaseForm<ChanDoanInput>()
  const [themDotOpen, setThemDotOpen] = useState(false)
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
  const benhList = useQuery({
    queryKey: ['benh-replica', site],
    queryFn: () => getBenhReplica(site),
    enabled: !!dangXem,
  })

  const themDot = useMutation({
    mutationFn: (body: ChanDoanInput) => themChanDoan(site, dangXem!, body),
    onSuccess: (newDot) => {
      notify.success(`Đã thêm chẩn đoán & đợt điều trị "${newDot.tenBenh}" (${newDot.maCDDT}).`)
      setThemDotOpen(false)
      formThemDot.resetFields()
      queryClient.invalidateQueries({ queryKey: ['luot-chi-tiet', site, dangXem] })
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
    onError: (e) => notify.error(errorText(e)),
  })

  const moThemDot = () => {
    themDot.reset()
    formThemDot.resetFields()
    formThemDot.setFieldsValue({
      mucDo: 'Nhẹ',
      soLanChuaCanThiet: 1,
    })
    setThemDotOpen(true)
  }

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
  const benhOptions = (benhList.data ?? [])
    .filter((b) => !dot.some((item) => item.maBenh === b.maBenh))
    .map((b) => ({
      value: b.maBenh,
      label: `${b.tenBenh} (${b.maBenh}${b.maICD10 ? ` · ${b.maICD10}` : ''})`,
    }))
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
    { title: 'Thời gian', dataIndex: 'thoiGian', width: 170, render: (v: string) => dateTimeVN(v) },
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
            {l && (
              <BaseButton
                type="primary"
                icon={<DollarIcon />}
                onClick={() => go(`/hoa-don?q=${encodeURIComponent(l.maLuot)}`)}
              >
                Viện phí
              </BaseButton>
            )}
            {l?.maBN && (
              <BaseButton icon={<ProfileIcon />} onClick={() => go(`/ho-so?maBN=${encodeURIComponent(l.maBN!)}`)}>
                Hồ sơ
              </BaseButton>
            )}
            {kham || d.suaDuoc ? (
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
            title={kham ? `Chẩn đoán & Đợt điều trị (${dot.length})` : 'Đợt điều trị'}
            extra={
              kham && (
                <BaseWritable>
                  <BaseButton
                    size="small"
                    type="primary"
                    icon={<AddIcon />}
                    onClick={moThemDot}
                  >
                    Thêm chẩn đoán
                  </BaseButton>
                </BaseWritable>
              )
            }
            style={{ margin: '16px 0' }}
          >
            {dot.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="muted" style={{ marginBottom: 12 }}>
                  Không phát hiện bệnh — chưa mở đợt điều trị nào từ lượt khám này.
                </div>
                {kham && (
                  <BaseWritable>
                    <BaseButton type="primary" icon={<AddIcon />} onClick={moThemDot}>
                      Thêm chẩn đoán & đợt điều trị
                    </BaseButton>
                  </BaseWritable>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dot.map((x) => {
                  const cacLuotChuaCuaDot = kham ? d.luotChua.filter((lc) => lc.maCDDT === x.maCDDT) : []
                  return (
                    <div
                      key={x.maCDDT}
                      style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        padding: '12px 14px',
                        background: '#fafafa',
                      }}
                    >
                      {/* Tiêu đề & Thông tin đợt chẩn đoán */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {x.tenBenh ?? x.maBenh} {x.maICD10 && <BaseTag>{x.maICD10}</BaseTag>}
                          </div>
                          <div className="muted" style={{ marginTop: 2 }}>
                            <code>{x.maCDDT}</code> · Mức độ: {x.mucDo ?? '—'} · Đã chữa {x.soLanDaChua}/{x.soLanChuaCanThiet ?? '?'} lần
                          </div>
                        </div>
                        <BaseSpace wrap>
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
                      </div>

                      {/* Danh sách các lượt chữa tương ứng của đợt này */}
                      {kham && (
                        <div style={{ marginTop: 10, background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                          <div
                            style={{
                              padding: '6px 12px',
                              background: '#f9f9f9',
                              borderBottom: '1px solid #f0f0f0',
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'rgba(0, 0, 0, 0.75)',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Lượt chữa của đợt này ({cacLuotChuaCuaDot.length})</span>
                            {cacLuotChuaCuaDot.length > 0 && (
                              <span className="muted" style={{ fontWeight: 400 }}>
                                Tổng tiền chữa: {money(cacLuotChuaCuaDot.reduce((s, c) => s + c.tongTien, 0))}
                              </span>
                            )}
                          </div>
                          {cacLuotChuaCuaDot.length === 0 ? (
                            <div className="muted" style={{ padding: '12px', textAlign: 'center', fontSize: 12 }}>
                              Chưa có lượt chữa nào cho đợt này
                            </div>
                          ) : (
                            <BaseTable<Luot>
                              rowKey="maLuot"
                              size="small"
                              columns={luotChuaColumns}
                              dataSource={cacLuotChuaCuaDot}
                              pagination={false}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
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

      <BaseFormModal<ChanDoanInput>
        open={themDotOpen}
        title={`Thêm chẩn đoán & đợt điều trị · ${l?.maLuot ?? ''}`}
        okText="Thêm đợt"
        form={formThemDot}
        onSubmit={(v) => themDot.mutate(v)}
        onCancel={() => setThemDotOpen(false)}
        loading={themDot.isPending}
        error={themDot.error}
      >
        <BaseFormItem
          name="maBenh"
          label="Bệnh chẩn đoán"
          rules={[{ required: true, message: 'Chọn bệnh chẩn đoán' }]}
        >
          <BaseSelect
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Chọn bệnh trong danh mục"
            options={benhOptions}
            loading={benhList.isLoading}
          />
        </BaseFormItem>
        <BaseRow gutter={16}>
          <BaseCol span={12}>
            <BaseFormItem
              name="mucDo"
              label="Mức độ"
              rules={[{ required: true, message: 'Chọn mức độ bệnh' }]}
            >
              <BaseSelect options={MUC_DO.map((m) => ({ value: m, label: m }))} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol span={12}>
            <BaseFormItem
              name="soLanChuaCanThiet"
              label="Số lần chữa cần thiết"
              rules={[
                { required: true, message: 'Nhập số lần chữa' },
                { type: 'number', min: 1, message: 'Số lần chữa ≥ 1 (BR8)' },
              ]}
            >
              <BaseNumberInput min={1} precision={0} style={{ width: '100%' }} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
        <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Hệ thống sẽ mở một đợt điều trị mới (<code>CDDT-{l?.maKhoa?.slice(0, 3) || 'CNx'}-...</code>) với trạng thái "Đang điều trị" và cập nhật vào kết luận khám nếu cần.
        </div>
      </BaseFormModal>

    </BaseDrawer>
  )
}
