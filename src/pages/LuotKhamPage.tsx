import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { createLuotKham, getBenhNhan, getDotDangDieuTri, searchBenhNhanToanChuoi } from '../api/endpoints'
import type { ChanDoanInput, LuotKhamRequest, TaoLuot } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseCheckableTags,
  BaseCol,
  BaseDatePicker,
  BaseDateTimePicker,
  BaseDescriptions,
  BaseErrorAlert,
  BaseForm,
  BaseFormItem,
  BaseFormList,
  BaseInput,
  BaseNumberInput,
  BaseRow,
  BaseSelect,
  BaseTag,
  BaseTextArea,
  DeleteIcon,
  useBaseForm,
  useBaseWatch,
} from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { age, blankToNull, dateVN, money } from '../utils/format'
import { LuotItemsEditor } from './luot/LuotItemsEditor'
import { LuotSavedModal } from './luot/LuotSavedModal'
import { LuotSummaryCard } from './luot/LuotSummaryCard'
import {
  applyFieldErrors,
  khongTrung,
  LOAI_KHAM_BENH,
  LUOT_QUERY_KEYS,
  MUC_DO,
  THUONG_HO_TRO,
  maLuotPreview,
  tinhTien,
  toChiTietInput,
  toLocalDateTime,
} from './luot/luotUtils'
import type { ChiTietFormValues } from './luot/luotUtils'
import { useLuotCatalogs } from './luot/useLuotCatalogs'

interface FormValues extends ChiTietFormValues {
  maBN?: string
  maKhoa?: string
  maBS?: string
  thoiGian: Dayjs
  lyDoKham?: string
  trieuChung?: string
  ketLuanKham?: string
  ngayHenTaiKham?: Dayjs | null
  ghiChu?: string
  chanDoan?: { maBenh?: string; mucDo: ChanDoanInput['mucDo']; soLanChuaCanThiet: number }[]
}

const now5 = () => {
  const n = dayjs()
  return n.minute(Math.floor(n.minute() / 5) * 5).second(0).millisecond(0)
}

/**
 * Tạo lượt khám: LUOT_KHAM_CHUA (KHAM) + LAN_KHAM + mỗi chẩn đoán mở một đợt CHAN_DOAN_DIEU_TRI + y tá hỗ trợ +
 * dịch vụ, thuốc, thiết bị — backend lưu cả form trong một transaction tại chi nhánh.
 */
export function LuotKhamPage() {
  const { site, branch } = useSite()
  const [params] = useSearchParams()
  const form = useBaseForm<FormValues>()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState<TaoLuot | null>(null)
  const cat = useLuotCatalogs(site)

  const maBNParam = params.get('maBN') ?? undefined
  const values = (useBaseWatch([], form) ?? {}) as Partial<FormValues>
  const maBN = values.maBN
  const maKhoa = values.maKhoa
  const maBS = values.maBS

  const local = useQuery({ queryKey: ['benh-nhan', site, ''], queryFn: () => getBenhNhan(site) })
  const localBN = (local.data ?? []).find((p) => p.maBN === maBN)
  // Bệnh nhân chưa có hồ sơ tại chi nhánh (đến từ màn Tiếp đón): lấy thông tin từ view toàn chuỗi
  const chain = useQuery({
    queryKey: ['benh-nhan-toan-chuoi', site, maBNParam],
    queryFn: () => searchBenhNhanToanChuoi(site, maBNParam!),
    enabled: !!maBNParam && !!local.data && !local.data.some((p) => p.maBN === maBNParam),
    retry: false,
  })
  const chainBN = (chain.data ?? []).find((p) => p.maBN === maBN)
  const dotMo = useQuery({
    queryKey: ['dot-dang', site, maBN],
    queryFn: () => getDotDangDieuTri(site, maBN!),
    enabled: !!localBN,
  })

  const khamDV = cat.catalogs.dichVu.find((d) => d.loaiDV === LOAI_KHAM_BENH)

  const reset = (bn?: string) => {
    form.resetFields()
    form.setFieldsValue({
      maBN: bn,
      thoiGian: now5(),
      chanDoan: [],
      yTa: [],
      dichVu: khamDV ? [{ maDV: khamDV.maDV, soLuong: 1 }] : [],
      thuoc: [],
      thietBi: [],
    })
  }

  // Khởi tạo form khi danh mục dịch vụ đã tải (tự thêm dịch vụ "Khám bệnh") hoặc khi đổi bệnh nhân trên URL
  useEffect(() => {
    if (!cat.loading) reset(maBNParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi đổi chi nhánh / bệnh nhân trên URL
  }, [cat.loading, site, maBNParam])

  const save = useMutation({
    mutationFn: (body: LuotKhamRequest) => createLuotKham(site, body),
    onSuccess: (r) => {
      setSaved(r)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      reset(maBN)
    },
    onError: (e) => applyFieldErrors(form, e),
  })

  const submit = (v: FormValues) =>
    save.mutate({
      maBN: v.maBN!,
      maKhoa: v.maKhoa!,
      maBS: v.maBS!,
      thoiGian: toLocalDateTime(v.thoiGian),
      lyDoKham: blankToNull(v.lyDoKham),
      trieuChung: blankToNull(v.trieuChung),
      ketLuanKham: blankToNull(v.ketLuanKham),
      ngayHenTaiKham: v.ngayHenTaiKham ? v.ngayHenTaiKham.format('YYYY-MM-DD') : null,
      ghiChu: blankToNull(v.ghiChu),
      chanDoan: (v.chanDoan ?? []).filter((c) => c?.maBenh).map((c) => ({ ...c, maBenh: c.maBenh! })),
      ...toChiTietInput(v),
    })

  const bnOptions = [
    ...(local.data ?? []).map((p) => ({ value: p.maBN, label: `${p.hoTen} · ${p.maBN}${p.cccd ? ` · ${p.cccd}` : ''}` })),
    ...(chain.data ?? [])
      .filter((p) => !(local.data ?? []).some((x) => x.maBN === p.maBN))
      .map((p) => ({ value: p.maBN, label: `${p.hoTen} · ${p.maBN} · từ chi nhánh khác` })),
  ]
  const bacSiOptions = cat.bacSi
    .filter((b) => !maKhoa || b.maKhoa === maKhoa)
    .map((b) => ({ value: b.maNV, label: `${b.hoTen} · ${b.tenKhoa ?? b.maKhoa}` }))
  const dangMo = dotMo.data ?? []
  const benhOptions = cat.benh.map((b) => {
    const open = dangMo.find((d) => d.maBenh === b.maBenh)
    return {
      value: b.maBenh,
      label: `${b.tenBenh}${b.maICD10 ? ` · ${b.maICD10}` : ''}${open ? ' — đang điều trị (BR4)' : ''}`,
      disabled: !!open,
    }
  })
  const yTaOptions = cat.yTa.map((y) => ({ value: y.maNV, label: y.hoTen, extra: y.tenKhoa ?? undefined }))
  const tien = tinhTien(values, cat.catalogs)
  const soChanDoan = (values.chanDoan ?? []).filter((c) => c?.maBenh).length
  const soYTa = (values.yTa ?? []).length
  const bn = localBN ?? chainBN

  return (
    <>
      <PageTitle
        title="Tạo lượt khám"
        description={`Mỗi bệnh được chẩn đoán mở một đợt điều trị riêng. Cả form lưu trong một transaction tại ${branch?.tenCn ?? site}.`}
        extra={<Link to="/tiep-don">Tra cứu ở màn Tiếp đón →</Link>}
      />

      {save.error && <BaseErrorAlert title="Chưa lưu được lượt khám" error={save.error} style={{ marginBottom: 16 }} />}
      {cat.error && <BaseErrorAlert title="Không tải được danh mục của chi nhánh" error={cat.error} style={{ marginBottom: 16 }} />}

      <BaseForm<FormValues> form={form} onFinish={submit} submitOnEnter={false}>
        <div className="luot-layout">
          <div>
            <BaseCard title={<>1. Bệnh nhân <span className="muted">LAN_KHAM.MaBN</span></>}>
              <BaseFormItem name="maBN" label="Bệnh nhân" rules={[{ required: true, message: 'Chọn bệnh nhân' }]}>
                <BaseSelect
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Gõ tên, mã hoặc CCCD bệnh nhân của chi nhánh…"
                  options={bnOptions}
                  loading={local.isLoading}
                  aria-label="Bệnh nhân"
                />
              </BaseFormItem>
              {bn && (
                <BaseDescriptions
                  size="small"
                  column={{ xs: 1, sm: 3 }}
                  items={[
                    { key: 'ns', label: 'Ngày sinh', children: `${dateVN(bn.ngaySinh)}${age(bn.ngaySinh) != null ? ` (${age(bn.ngaySinh)} tuổi)` : ''}` },
                    { key: 'gt', label: 'Giới tính', children: bn.gioiTinh ?? '—' },
                    { key: 'cccd', label: 'CCCD', children: bn.cccd ?? '—' },
                    ...(localBN
                      ? [
                          { key: 'du', label: 'Dị ứng', children: localBN.tienSuDiUng ? <BaseTag color="red">{localBN.tienSuDiUng}</BaseTag> : 'Không' },
                          { key: 'lk', label: 'Số lần khám tại CN', children: localBN.soLanKham },
                        ]
                      : []),
                  ]}
                />
              )}
              {maBN && !localBN && chainBN && (
                <BaseAlert
                  type="info"
                  title={`Chưa có hồ sơ tại ${branch?.shortName ?? site}`}
                  description={`Khi lưu, backend chép bản ghi BENH_NHAN (giữ mã ${maBN}) từ view toàn chuỗi vào ${site} trước, trong cùng transaction.`}
                />
              )}
              {dangMo.length > 0 && (
                <BaseAlert
                  type="warning"
                  style={{ marginTop: 12 }}
                  title={`Đang có ${dangMo.length} đợt điều trị chưa kết thúc tại chi nhánh`}
                  description={
                    <>
                      {dangMo.map((d) => `${d.tenBenh} (đã chữa ${d.soLanDaChua}/${d.soLanChuaCanThiet ?? '?'})`).join(', ')} — không chẩn đoán lại các bệnh
                      này (BR4); tái khám cho đợt đang mở thì dùng{' '}
                      <Link to={`/luot-chua-moi?maBN=${encodeURIComponent(maBN!)}`}>Tạo lượt chữa</Link>.
                    </>
                  }
                />
              )}
            </BaseCard>

            <BaseCard title={<>2. Thông tin khám <span className="muted">LUOT_KHAM_CHUA · LAN_KHAM</span></>}>
              <BaseRow gutter={16}>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem name="maKhoa" label="Khoa" rules={[{ required: true, message: 'Chọn khoa' }]}>
                    <BaseSelect
                      placeholder="Chọn khoa"
                      options={cat.khoa.map((k) => ({ value: k.maKhoa, label: k.tenKhoa }))}
                      onChange={(v) => {
                        const bs = cat.bacSi.find((b) => b.maNV === form.getFieldValue('maBS'))
                        if (bs && bs.maKhoa !== v) form.setFieldsValue({ maBS: undefined })
                      }}
                      aria-label="Khoa"
                    />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem
                    name="maBS"
                    label="Bác sĩ khám"
                    rules={[{ required: true, message: 'Chọn bác sĩ khám' }]}
                    extra="Chỉ bác sĩ đang làm việc của chi nhánh này (BR6)"
                  >
                    <BaseSelect
                      showSearch={{ optionFilterProp: 'label' }}
                      placeholder="Chọn bác sĩ"
                      options={bacSiOptions}
                      onChange={(v) => {
                        const bs = cat.bacSi.find((b) => b.maNV === v)
                        if (bs) form.setFieldsValue({ maKhoa: bs.maKhoa })
                      }}
                      aria-label="Bác sĩ khám"
                    />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem name="thoiGian" label="Thời gian khám" rules={[{ required: true, message: 'Chọn thời gian khám' }]}>
                    <BaseDateTimePicker disableFuture allowClear={false} />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem label="Mã lượt (BR5)" extra="K-MaKhoa-MaBS-yyMMdd-NNN — số thứ tự sinh khi lưu">
                    <BaseInput readOnly value={maLuotPreview('K', maKhoa, maBS, values.thoiGian)} style={{ fontFamily: 'monospace' }} />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24}>
                  <BaseFormItem name="lyDoKham" label="Lý do khám">
                    <BaseInput maxLength={500} />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24}>
                  <BaseFormItem name="trieuChung" label="Triệu chứng">
                    <BaseTextArea rows={2} maxLength={1000} />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem name="ketLuanKham" label="Kết luận khám" extra="Bỏ trống và không chẩn đoán → ghi “Không phát hiện bệnh”">
                    <BaseInput maxLength={500} placeholder="VD: Viêm họng cấp" />
                  </BaseFormItem>
                </BaseCol>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem
                    name="ngayHenTaiKham"
                    label="Ngày hẹn tái khám"
                    dependencies={['thoiGian']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, v: Dayjs | null) =>
                          !v || v.isAfter(getFieldValue('thoiGian'), 'day')
                            ? Promise.resolve()
                            : Promise.reject(new Error('Ngày hẹn phải sau ngày khám')),
                      }),
                    ]}
                  >
                    <BaseDatePicker />
                  </BaseFormItem>
                </BaseCol>
              </BaseRow>
            </BaseCard>

            <BaseCard title={<>3. Chẩn đoán → mở đợt điều trị <span className="muted">CHAN_DOAN_DIEU_TRI</span></>}>
              <BaseFormList name="chanDoan">
                {(fields, { add, remove }) => (
                  <>
                    {fields.length === 0 ? (
                      <BaseAlert
                        type="info"
                        title="Chưa có chẩn đoán"
                        description="Vẫn lưu được lượt khám không có chẩn đoán (không phát hiện bệnh / chờ kết quả) — khi đó không mở đợt điều trị (BR13)."
                        style={{ marginBottom: 12 }}
                      />
                    ) : (
                      <div className="item-row chan-doan item-head">
                        <div>Bệnh (ICD-10)</div>
                        <div>Mức độ</div>
                        <div>Số lần chữa cần thiết</div>
                        <div />
                      </div>
                    )}
                    {fields.map((field) => (
                      <div className="item-row chan-doan" key={field.key}>
                        <BaseFormItem
                          name={[field.name, 'maBenh']}
                          rules={[{ required: true, message: 'Chọn bệnh' }, khongTrung('chanDoan', 'maBenh', 'Bệnh (BR1)')]}
                        >
                          <BaseSelect showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn bệnh" options={benhOptions} aria-label="Bệnh" />
                        </BaseFormItem>
                        <BaseFormItem name={[field.name, 'mucDo']} rules={[{ required: true, message: 'Chọn mức độ' }]}>
                          <BaseSelect options={[...MUC_DO]} aria-label="Mức độ" />
                        </BaseFormItem>
                        <BaseFormItem name={[field.name, 'soLanChuaCanThiet']} rules={[{ required: true, message: 'Nhập số lần' }]}>
                          <BaseNumberInput min={1} precision={0} aria-label="Số lần chữa cần thiết" />
                        </BaseFormItem>
                        <BaseButton type="text" danger icon={<DeleteIcon />} aria-label="Xoá chẩn đoán" onClick={() => remove(field.name)} />
                      </div>
                    ))}
                    <BaseButton icon={<AddIcon />} onClick={() => add({ mucDo: 'Nhẹ', soLanChuaCanThiet: 1 })}>
                      Thêm chẩn đoán
                    </BaseButton>
                    <span className="muted" style={{ marginLeft: 12 }}>
                      Mỗi dòng = 1 đợt điều trị mới, trạng thái “Đang điều trị”.
                    </span>
                  </>
                )}
              </BaseFormList>
            </BaseCard>

            <BaseCard title={<>4. Y tá hỗ trợ <span className="muted">HO_TRO</span></>}>
              <BaseFormItem name="yTa" style={{ marginBottom: 8 }}>
                <BaseCheckableTags options={yTaOptions} />
              </BaseFormItem>
              <div className="muted">
                {soYTa > 0
                  ? `${soYTa} y tá × ${money(THUONG_HO_TRO)} = ${money(soYTa * THUONG_HO_TRO)} thưởng, cộng vào lương tháng (F3).`
                  : 'Chọn y tá tiếp đón / hỗ trợ — mỗi y tá là 1 dòng HO_TRO. Chỉ hiện y tá đang làm việc của chi nhánh (BR6).'}
              </div>
            </BaseCard>

            <BaseCard title="5. Dịch vụ · Thuốc · Thiết bị">
              <LuotItemsEditor form={form} catalogs={cat.catalogs} />
            </BaseCard>
          </div>

          <LuotSummaryCard
            title="Tóm tắt lượt khám"
            head={bn && <div style={{ marginBottom: 8 }}><b>{bn.hoTen}</b> <code>{bn.maBN}</code></div>}
            rows={[
              ['Đợt điều trị mở mới', soChanDoan],
              ['Y tá hỗ trợ', soYTa],
            ]}
            tien={tien}
            actions={
              <>
                <BaseButton onClick={() => reset(maBN)}>Làm lại</BaseButton>
                <BaseButton type="primary" htmlType="submit" loading={save.isPending}>
                  Lưu lượt khám
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
