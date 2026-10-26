import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { createLuotChua, getBenhNhan, getDotDangDieuTri, ngungDieuTri } from '../api/endpoints'
import { errorText } from '../api/http'
import type { DotDieuTri, LuotChuaRequest, TaoLuot } from '../api/types'
import {
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseCheckableTags,
  BaseCol,
  BaseDatePicker,
  BaseDateTimePicker,
  BaseDeleteButton,
  BaseErrorAlert,
  BaseForm,
  BaseFormItem,
  BaseInput,
  BaseNumberInput,
  BaseRow,
  BaseSegmented,
  BaseSelect,
  BaseTable,
  BaseTag,
  BaseTextArea,
  LockIcon,
  useBaseForm,
  useBaseWatch,
  useNotify,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { blankToNull, dateTimeVN, dateVN, money } from '../utils/format'
import { LuotItemsEditor } from './luot/LuotItemsEditor'
import { LuotSavedModal } from './luot/LuotSavedModal'
import { LuotSummaryCard } from './luot/LuotSummaryCard'
import {
  applyFieldErrors,
  HINH_THUC,
  KHOI,
  LOAI_KHAM_BENH,
  LUOT_QUERY_KEYS,
  THUONG_DOT_KHOI,
  THUONG_HO_TRO,
  TINH_TRANG,
  maLuotPreview,
  tinhTien,
  toChiTietInput,
  toLocalDateTime,
} from './luot/luotUtils'
import type { ChiTietFormValues } from './luot/luotUtils'
import { useLuotCatalogs } from './luot/useLuotCatalogs'

interface FormValues extends ChiTietFormValues {
  thoiGian: Dayjs
  hinhThuc?: string[]
  ketLuanSauChua?: string
  tinhTrangSauChua: string
  soLanChuaCanThiet?: number
  ngayHenTaiKham?: Dayjs | null
  ghiChu?: string
}

const now5 = () => {
  const n = dayjs()
  return n.minute(Math.floor(n.minute() / 5) * 5).second(0).millisecond(0)
}

/**
 * Tạo lượt chữa: lần tái khám / điều trị tiếp theo của một đợt đang mở.
 * Bác sĩ, khoa cố định theo lần khám mở đợt (BR2); thời gian phải sau lượt gần nhất của đợt (BR3);
 * "Khỏi" kết thúc đợt (BR10); lần chữa trong đợt không tính tiền khám (BR11).
 */
export function LuotChuaPage() {
  const { site, branch } = useSite()
  const [params, setParams] = useSearchParams()
  const form = useBaseForm<FormValues>()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState<TaoLuot | null>(null)
  const cat = useLuotCatalogs(site)

  const maBN = params.get('maBN') ?? undefined
  const maCDDT = params.get('maCDDT') ?? undefined
  const setQuery = (bn?: string, dot?: string) => {
    const next: Record<string, string> = {}
    if (bn) next.maBN = bn
    if (dot) next.maCDDT = dot
    setParams(next, { replace: true })
  }

  const patients = useQuery({ queryKey: ['benh-nhan', site, ''], queryFn: () => getBenhNhan(site) })
  const dots = useQuery({
    queryKey: ['dot-dang', site, maBN],
    queryFn: () => getDotDangDieuTri(site, maBN!),
    enabled: !!maBN,
  })
  const dotList = dots.data ?? []
  const dot = dotList.find((d) => d.maCDDT === maCDDT)

  // Chỉ có một đợt đang mở → chọn sẵn
  useEffect(() => {
    if (maBN && !maCDDT && dotList.length === 1) setQuery(maBN, dotList[0].maCDDT)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi danh sách đợt đổi
  }, [dots.data])

  const reset = (d?: DotDieuTri) => {
    form.resetFields()
    form.setFieldsValue({
      thoiGian: now5(),
      hinhThuc: [],
      tinhTrangSauChua: 'Đỡ',
      soLanChuaCanThiet: d?.soLanChuaCanThiet ?? 1,
      yTa: [],
      dichVu: [],
      thuoc: [],
      thietBi: [],
    })
  }
  useEffect(() => {
    reset(dot)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khởi tạo lại khi chọn đợt khác
  }, [dot?.maCDDT, site])

  const values = (useBaseWatch([], form) ?? {}) as Partial<FormValues>
  const khoi = values.tinhTrangSauChua === KHOI

  const save = useMutation({
    mutationFn: (body: LuotChuaRequest) => createLuotChua(site, body),
    onSuccess: (r) => {
      setSaved(r)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      if (r.ketThucDot) setQuery(maBN)
      else reset(dot)
    },
    onError: (e) => applyFieldErrors(form, e),
  })

  const stop = useMutation({
    mutationFn: (ma: string) => ngungDieuTri(site, ma),
    onSuccess: (d) => {
      notify.warning(`Đợt "${d.tenBenh}" đã chuyển "Ngừng điều trị" — bác sĩ không được thưởng cho đợt này.`)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      setQuery(maBN)
    },
    onError: (e) => notify.error(errorText(e)),
  })

  const submit = (v: FormValues) =>
    save.mutate({
      maCDDT: dot!.maCDDT,
      thoiGian: toLocalDateTime(v.thoiGian),
      hinhThuc: v.hinhThuc ?? [],
      ketLuanSauChua: blankToNull(v.ketLuanSauChua),
      tinhTrangSauChua: v.tinhTrangSauChua,
      soLanChuaCanThiet: v.soLanChuaCanThiet ?? null,
      ngayHenTaiKham: !khoi && v.ngayHenTaiKham ? v.ngayHenTaiKham.format('YYYY-MM-DD') : null,
      ghiChu: blankToNull(v.ghiChu),
      ...toChiTietInput(v),
    })

  const bnOptions = [...(patients.data ?? [])]
    .sort((a, b) => b.soDotDangDieuTri - a.soDotDangDieuTri || a.maBN.localeCompare(b.maBN))
    .map((p) => ({
      value: p.maBN,
      label: `${p.hoTen} · ${p.maBN}${p.soDotDangDieuTri ? ` · ${p.soDotDangDieuTri} đợt đang điều trị` : ''}`,
    }))
  // BR11: lần chữa không tính dịch vụ "Khám bệnh"
  const catalogs = { ...cat.catalogs, dichVu: cat.catalogs.dichVu.filter((d) => d.loaiDV !== LOAI_KHAM_BENH) }
  const tien = tinhTien(values, catalogs)
  const lanThu = dot ? dot.soLanDaChua + 1 : 0
  const soYTa = (values.yTa ?? []).length
  const soLanDuKien = values.soLanChuaCanThiet ?? dot?.soLanChuaCanThiet ?? 1

  const dotColumns: BaseColumns<DotDieuTri> = [
    {
      title: 'Bệnh',
      render: (_, d) => (
        <>
          <b>{d.tenBenh ?? d.maBenh}</b> {d.mucDo && <BaseTag>{d.mucDo}</BaseTag>}
          <div className="muted">
            <code>{d.maCDDT}</code>
          </div>
        </>
      ),
    },
    { title: 'Tiến trình', width: 110, render: (_, d) => `${d.soLanDaChua}/${d.soLanChuaCanThiet ?? '?'} lần` },
    { title: 'Bác sĩ phụ trách', dataIndex: 'tenBS', width: 170, render: (v: string | null, d) => v ?? d.maBS },
    {
      title: 'Lượt gần nhất · hẹn',
      width: 170,
      render: (_, d) => (
        <>
          {dateTimeVN(d.luotGanNhat)}
          <div className="muted">hẹn {dateVN(d.ngayHenTaiKham)}</div>
          {d.quaHan && <BaseTag color="warning">Quá 30 ngày (BR12)</BaseTag>}
        </>
      ),
    },
    {
      title: '',
      key: 'ngung',
      width: 130,
      align: 'right',
      render: (_, d) => (
        <span onClick={(e) => e.stopPropagation()}>
          <BaseDeleteButton
            title={`Ngừng điều trị đợt "${d.tenBenh}"?`}
            description="Bệnh nhân bỏ dở điều trị (BR12) — đợt kết thúc, bác sĩ không được thưởng."
            okText="Ngừng điều trị"
            onConfirm={() => stop.mutateAsync(d.maCDDT)}
          >
            Ngừng
          </BaseDeleteButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Tạo lượt chữa"
        description={`Lần tái khám / điều trị tiếp theo của một đợt đang mở tại ${branch?.tenCn ?? site}.`}
        extra={<Link to="/luot-kham-moi">Bệnh mới / mắc lại → Tạo lượt khám</Link>}
      />

      {save.error && <BaseErrorAlert title="Chưa lưu được lượt chữa" error={save.error} style={{ marginBottom: 16 }} />}
      {cat.error && <BaseErrorAlert title="Không tải được danh mục của chi nhánh" error={cat.error} style={{ marginBottom: 16 }} />}

      <BaseForm<FormValues> form={form} onFinish={submit} submitOnEnter={false}>
        <div className="luot-layout">
          <div>
            <BaseCard title="1. Bệnh nhân">
              <BaseFormItem label="Bệnh nhân" required style={{ marginBottom: 0 }}>
                <BaseSelect
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Chọn bệnh nhân (bệnh nhân có đợt đang điều trị ở trên)"
                  value={maBN}
                  options={bnOptions}
                  loading={patients.isLoading}
                  onChange={(v) => setQuery(v)}
                  aria-label="Bệnh nhân"
                />
              </BaseFormItem>
            </BaseCard>

            <BaseCard title={<>2. Chọn đợt điều trị đang mở <span className="muted">CHAN_DOAN_DIEU_TRI</span></>}>
              {!maBN ? (
                <span className="muted">Chọn bệnh nhân để xem các đợt đang điều trị.</span>
              ) : dots.isSuccess && dotList.length === 0 ? (
                <BaseAlert
                  type="warning"
                  title="Không có đợt đang điều trị tại chi nhánh này"
                  description={
                    <>
                      Không thể thêm lần chữa vào đợt đã khỏi hoặc đã ngừng (BR3, BR12). Nếu bệnh nhân mắc lại →{' '}
                      <Link to={`/luot-kham-moi?maBN=${encodeURIComponent(maBN)}`}>tạo lượt khám mới</Link>.
                    </>
                  }
                />
              ) : (
                <BaseTable<DotDieuTri>
                  rowKey="maCDDT"
                  size="small"
                  pagination={false}
                  loading={dots.isLoading || stop.isPending}
                  columns={dotColumns}
                  dataSource={dotList}
                  scroll={{ x: 720 }}
                  rowSelection={{
                    type: 'radio',
                    selectedRowKeys: maCDDT ? [maCDDT] : [],
                    onChange: (keys) => setQuery(maBN, String(keys[0])),
                  }}
                  onRow={(d) => ({ onClick: () => setQuery(maBN, d.maCDDT), className: 'clickable-row' })}
                />
              )}
            </BaseCard>

            {dot && (
              <>
                <BaseCard title={<>3. Thông tin lần chữa <span className="muted">LUOT_KHAM_CHUA · LAN_CHUA · LAN_CHUA_HINH_THUC</span></>}>
                  <BaseRow gutter={16}>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem label="Bác sĩ thực hiện" extra="BR2: cố định theo bác sĩ đã khám mở đợt">
                        <BaseInput disabled prefix={<LockIcon />} value={`${dot.tenBS ?? ''} · ${dot.maBS}`} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem label="Khoa">
                        <BaseInput disabled prefix={<LockIcon />} value={dot.tenKhoa ?? dot.maKhoa} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem
                        name="thoiGian"
                        label="Thời gian chữa"
                        extra={`Phải sau ${dateTimeVN(dot.luotGanNhat)} — lượt gần nhất của đợt (BR3)`}
                        rules={[
                          { required: true, message: 'Chọn thời gian chữa' },
                          {
                            validator: (_, v: Dayjs | undefined) =>
                              !v || v.isAfter(dayjs(dot.luotGanNhat))
                                ? Promise.resolve()
                                : Promise.reject(new Error('Phải sau lượt gần nhất của đợt (BR3)')),
                          },
                        ]}
                      >
                        <BaseDateTimePicker disableFuture allowClear={false} disabledDate={(d) => d.isBefore(dayjs(dot.luotGanNhat), 'day')} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem label="Mã lượt (BR5)" extra={`Lần chữa thứ ${lanThu} của đợt`}>
                        <BaseInput readOnly value={maLuotPreview('C', dot.maKhoa, dot.maBS, values.thoiGian)} style={{ fontFamily: 'monospace' }} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24}>
                      <BaseFormItem
                        name="hinhThuc"
                        label={<>Hình thức chữa <span className="muted">&nbsp;LAN_CHUA_HINH_THUC (đa trị)</span></>}
                        rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một hình thức chữa' }]}
                      >
                        <BaseCheckableTags options={HINH_THUC.map((h) => ({ value: h, label: h }))} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24}>
                      <BaseFormItem name="ketLuanSauChua" label="Kết luận sau chữa">
                        <BaseTextArea rows={2} maxLength={1000} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem name="tinhTrangSauChua" label="Tình trạng sau chữa" extra="Chọn “Khỏi” để kết thúc đợt (BR10)" rules={[{ required: true }]}>
                        <BaseSegmented options={[...TINH_TRANG]} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={12} md={6}>
                      <BaseFormItem name="soLanChuaCanThiet" label="Số lần chữa cần thiết" extra={`Bác sĩ được điều chỉnh · hiện ${dot.soLanChuaCanThiet ?? '?'}`}>
                        <BaseNumberInput min={1} precision={0} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={12} md={6}>
                      <BaseFormItem
                        name="ngayHenTaiKham"
                        label="Hẹn tái khám tiếp"
                        dependencies={['thoiGian']}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator: (_, v: Dayjs | null) =>
                              khoi || !v || v.isAfter(getFieldValue('thoiGian'), 'day')
                                ? Promise.resolve()
                                : Promise.reject(new Error('Phải sau ngày chữa')),
                          }),
                        ]}
                      >
                        <BaseDatePicker disabled={khoi} />
                      </BaseFormItem>
                    </BaseCol>
                  </BaseRow>
                  {khoi ? (
                    <BaseAlert
                      type="success"
                      title="Lần chữa này kết thúc đợt điều trị"
                      description={`Đợt chuyển “Đã khỏi”, NgayKetThuc = thời gian lượt. ${dot.tenBS ?? dot.maBS} được +${money(THUONG_DOT_KHOI)} vào lương tháng ${(values.thoiGian ?? dayjs()).format('MM/YYYY')} (F3).`}
                    />
                  ) : lanThu >= soLanDuKien ? (
                    <BaseAlert
                      type="warning"
                      title="Đã đạt số lần chữa dự kiến nhưng chưa khỏi"
                      description="Đợt chỉ kết thúc khi kết luận “Khỏi” — cân nhắc tăng “Số lần chữa cần thiết”."
                    />
                  ) : null}
                  {dot.quaHan && (
                    <BaseAlert
                      type="warning"
                      style={{ marginTop: 8 }}
                      title="Bệnh nhân quá 30 ngày chưa quay lại (BR12)"
                      description="Theo quy tắc, đợt này nên chuyển “Ngừng điều trị”. Vẫn có thể ghi lần chữa nếu bệnh nhân tiếp tục điều trị."
                    />
                  )}
                </BaseCard>

                <BaseCard title={<>4. Y tá hỗ trợ <span className="muted">HO_TRO</span></>}>
                  <BaseFormItem name="yTa" style={{ marginBottom: 8 }}>
                    <BaseCheckableTags options={cat.yTa.map((y) => ({ value: y.maNV, label: y.hoTen, extra: y.tenKhoa ?? undefined }))} />
                  </BaseFormItem>
                  <div className="muted">
                    {soYTa > 0
                      ? `${soYTa} y tá × ${money(THUONG_HO_TRO)} = ${money(soYTa * THUONG_HO_TRO)} thưởng (F3).`
                      : 'Chọn y tá tiêm, cấp thuốc, trị liệu… — mỗi y tá là 1 dòng HO_TRO.'}
                  </div>
                </BaseCard>

                <BaseCard title="5. Dịch vụ · Thuốc · Thiết bị">
                  <BaseAlert
                    type="info"
                    title="Miễn phí khám (BR11)"
                    description="Tái khám trong đợt không tính dịch vụ “Khám bệnh”; chỉ tính thủ thuật, nhân công, thuốc, xét nghiệm / chụp chiếu, thiết bị."
                    style={{ marginBottom: 12 }}
                  />
                  <LuotItemsEditor form={form} catalogs={catalogs} />
                </BaseCard>
              </>
            )}
          </div>

          <LuotSummaryCard
            title="Tóm tắt lượt chữa"
            head={
              dot && (
                <div style={{ marginBottom: 8 }}>
                  <b>{dot.tenBN}</b> <code>{dot.maBN}</code>
                </div>
              )
            }
            rows={
              dot
                ? [
                    ['Đợt', dot.tenBenh],
                    ['Lần chữa thứ', lanThu],
                    ['Y tá hỗ trợ', soYTa],
                    ['Kết thúc đợt', khoi ? 'Có — Đã khỏi' : 'Chưa'],
                  ]
                : []
            }
            tien={tien}
            actions={
              <>
                <BaseButton onClick={() => reset(dot)} disabled={!dot}>
                  Làm lại
                </BaseButton>
                <BaseButton type="primary" htmlType="submit" loading={save.isPending} disabled={!dot}>
                  Lưu lượt chữa
                </BaseButton>
              </>
            }
          />
        </div>
      </BaseForm>

      <LuotSavedModal saved={saved} onClose={() => setSaved(null)} />
    </>
  )
}
