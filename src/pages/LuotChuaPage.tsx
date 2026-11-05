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
  BaseDateTimePicker,
  BaseDeleteButton,
  BaseErrorAlert,
  BaseForm,
  BaseFormItem,
  BaseInput,
  BaseRow,
  BaseSelect,
  BaseTable,
  BaseTag,
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
  LOAI_KHAM_BENH,
  LUOT_QUERY_KEYS,
  THUONG_HO_TRO,
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
  ghiChu?: string
}



/**
 * Tạo lượt chữa: lần tái khám / điều trị tiếp theo của một đợt đang mở.
 * Bác sĩ, khoa cố định theo lần khám mở đợt (BR2); thời gian phải sau lượt gần nhất của đợt (BR3);
 * lần chữa trong đợt không tính tiền khám (BR11). Kết quả lần chữa (tình trạng — "Khỏi" kết thúc đợt, BR10 —, kết luận,
 * số lần chữa cần thiết, hẹn tái khám) ghi sau, ở nút Sửa của chi tiết lượt.
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

  const reset = () => {
    form.resetFields()
    form.setFieldsValue({
      thoiGian: dayjs(),
      hinhThuc: [],
      yTa: [],
      dichVu: [],
      thuoc: [],
      thietBi: [],
    })
  }
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khởi tạo lại khi chọn đợt khác
  }, [dot?.maCDDT, site])

  const values = (useBaseWatch([], form) ?? {}) as Partial<FormValues>

  const save = useMutation({
    mutationFn: (body: LuotChuaRequest) => createLuotChua(site, body),
    onSuccess: (r) => {
      setSaved(r)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      reset()
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
      thoiGian: toLocalDateTime(v.thoiGian ?? dayjs()),
      hinhThuc: v.hinhThuc ?? [],
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
  const datDuKien = !!dot && lanThu >= (dot.soLanChuaCanThiet ?? 1)

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
      width: 185,
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

      <BaseForm<FormValues> form={form} initialValues={{ thoiGian: dayjs() }} onFinish={submit} submitOnEnter={false}>
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
                        extra="Thời gian hiện tại của lần chữa (cố định)"
                      >
                        <BaseDateTimePicker disabled allowClear={false} format="DD/MM/YYYY HH:mm:ss" showTime={{ format: 'HH:mm:ss' }} />
                      </BaseFormItem>
                    </BaseCol>
                    <BaseCol xs={24} md={12}>
                      <BaseFormItem label="Mã lượt (BR5)" extra={`Lần chữa thứ ${lanThu} của đợt (tự sinh)`}>
                        <BaseInput disabled prefix={<LockIcon />} value={maLuotPreview('C', dot.maKhoa, dot.maBS, values.thoiGian ?? dayjs())} style={{ fontFamily: 'monospace' }} />
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
                  </BaseRow>
                  <BaseAlert
                    type={datDuKien ? 'warning' : 'info'}
                    title={
                      datDuKien
                        ? `Lần chữa này đạt số lần chữa dự kiến (${dot.soLanChuaCanThiet ?? 1} lần)`
                        : 'Kết quả lần chữa ghi sau khi chữa'
                    }
                    description="Tình trạng sau chữa, kết luận, số lần chữa cần thiết và hẹn tái khám tiếp: sau khi lưu, mở chi tiết lượt → Sửa. Chọn “Khỏi” ở đó để kết thúc đợt (BR10)."
                  />
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
                    ['Số lần dự kiến', dot.soLanChuaCanThiet ?? '?'],
                  ]
                : []
            }
            tien={tien}
            actions={
              <>
                <BaseButton onClick={reset} disabled={!dot}>
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
