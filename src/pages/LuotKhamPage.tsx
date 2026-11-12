import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { createLuotKham, getBenhNhan, getDotDangDieuTri, getPhieuKhamGoc } from '../api/endpoints'
import type { ChanDoanInput, LuotKhamRequest, TaoLuot } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseCard,
  BaseCheckableTags,
  BaseCol,
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
  ghiChu?: string
  loaiKham?: 'BAN_DAU' | 'BO_SUNG'
  maPhieuGoc?: string
  chanDoan?: { maBenh?: string; mucDo: ChanDoanInput['mucDo']; soLanChuaCanThiet: number }[]
}



/**
 * Tạo lượt khám: PHIEU_KHAM + mỗi chẩn đoán mở một DOT_DIEU_TRI + y tá hỗ trợ +
 * dịch vụ khám/CLS (DV_KHAM), kê đơn thuốc (KE_DON). Theo spec phiếu khám không sử dụng thiết bị (SU_DUNG_TB chỉ dùng cho PHIEU_DIEU_TRI).
 */
export function LuotKhamPage() {
  const { site, branch } = useSite()
  const [params] = useSearchParams()
  const form = useBaseForm<FormValues>()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState<TaoLuot | null>(null)
  const cat = useLuotCatalogs(site)

  const maBNParam = params.get('maBN') ?? undefined
  const maPhieuGocParam = params.get('maPhieuGoc') ?? undefined
  const values = (useBaseWatch([], form) ?? {}) as Partial<FormValues>
  const maBN = values.maBN
  const maKhoa = values.maKhoa
  const maBS = values.maBS

  const local = useQuery({ queryKey: ['benh-nhan', site, ''], queryFn: () => getBenhNhan(site) })
  const localBN = (local.data ?? []).find((p) => p.maBN === maBN)
  const dotMo = useQuery({
    queryKey: ['dot-dang', site, maBN],
    queryFn: () => getDotDangDieuTri(site, maBN!),
    enabled: !!localBN,
  })
  const phieuGocQuery = useQuery({
    queryKey: ['phieu-kham-goc', site, maBN],
    queryFn: () => getPhieuKhamGoc(site, maBN!),
    enabled: !!maBN,
  })

  useEffect(() => {
    if (values.loaiKham === 'BO_SUNG' && !form.getFieldValue('maPhieuGoc') && phieuGocQuery.data?.length === 1) {
      form.setFieldsValue({ maPhieuGoc: phieuGocQuery.data[0].maLuot })
    }
  }, [values.loaiKham, phieuGocQuery.data, form])

  const khamDV = cat.catalogs.dichVu.find((d) => d.loaiDV === LOAI_KHAM_BENH)

  const reset = (bn?: string, pg?: string) => {
    const isBoSung = !!(pg || maPhieuGocParam)
    form.resetFields()
    form.setFieldsValue({
      maBN: bn,
      thoiGian: dayjs(),
      loaiKham: isBoSung ? 'BO_SUNG' : 'BAN_DAU',
      maPhieuGoc: pg || maPhieuGocParam,
      chanDoan: [],
      yTa: [],
      dichVu: khamDV ? [{ maDV: khamDV.maDV, soLuong: 1 }] : [],
      thuoc: [],
    })
  }

  // Khởi tạo form khi danh mục dịch vụ đã tải (tự thêm dịch vụ "Khám bệnh") hoặc khi đổi bệnh nhân trên URL
  useEffect(() => {
    if (!cat.loading) reset(maBNParam, maPhieuGocParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi đổi chi nhánh / bệnh nhân trên URL
  }, [cat.loading, site, maBNParam, maPhieuGocParam])

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
      ghiChu: blankToNull(v.ghiChu),
      maPhieuGoc: v.loaiKham === 'BO_SUNG' ? blankToNull(v.maPhieuGoc) : null,
      chanDoan: (v.chanDoan ?? []).filter((c) => c?.maBenh).map((c) => ({ ...c, maBenh: c.maBenh! })),
      ...toChiTietInput(v, { excludeThietBi: true }),
    })

  const bnOptions = [
    ...(local.data ?? []).map((p) => ({ value: p.maBN, label: `${p.hoTen} · ${p.maBN}${p.cccd ? ` · ${p.cccd}` : ''}` })),
  ]
  const bacSiOptions = cat.bacSi
    .filter((b) => !maKhoa || b.maKhoa === maKhoa)
    .map((b) => ({ value: b.maNV, label: `${b.hoTen} · ${b.tenKhoa ?? b.maKhoa}` }))
  const dangMo = dotMo.data ?? []
  const benhOptions = cat.benh.map((b) => {
    const open = dangMo.find((d) => d.maBenh === b.maBenh)
    return {
      value: b.maBenh,
      label: `${b.tenBenh}${b.maICD10 ? ` · ${b.maICD10}` : ''}${open ? ' — đang điều trị' : ''}`,
      disabled: !!open,
    }
  })
  const yTaOptions = cat.yTa
    .filter((y) => !maKhoa || y.maKhoa === maKhoa)
    .map((y) => ({ value: y.maNV, label: y.hoTen, extra: y.tenKhoa ?? undefined }))
  const tien = tinhTien(values, cat.catalogs, { excludeThietBi: true })
  const soChanDoan = (values.chanDoan ?? []).filter((c) => c?.maBenh).length
  const soYTa = (values.yTa ?? []).length
  const bn = localBN

  return (
    <>
      <PageTitle
        title={values.loaiKham === 'BO_SUNG' ? 'Tạo lượt khám bổ sung' : 'Tạo lượt khám'}
        description={
          values.loaiKham === 'BO_SUNG'
            ? `Khám bổ sung hội chẩn hoặc đọc kết quả cận lâm sàng theo phiếu gốc tại ${branch?.tenCn ?? site}.`
            : `Mỗi bệnh được chẩn đoán mở một đợt điều trị riêng tại ${branch?.tenCn ?? site}.`
        }
        extra={<Link to="/tiep-don">Tra cứu ở màn Tiếp đón →</Link>}
      />

      {save.error && <BaseErrorAlert title="Chưa lưu được lượt khám" error={save.error} style={{ marginBottom: 16 }} />}
      {cat.error && <BaseErrorAlert title="Không tải được danh mục của chi nhánh" error={cat.error} style={{ marginBottom: 16 }} />}

      <BaseForm<FormValues> form={form} initialValues={{ thoiGian: dayjs(), loaiKham: 'BAN_DAU' }} onFinish={submit} submitOnEnter={false}>
        <div className="luot-layout">
          <div>
            <BaseCard title="1. Bệnh nhân & Hình thức khám">
              <BaseFormItem name="maBN" label="Bệnh nhân" rules={[{ required: true, message: 'Chọn bệnh nhân' }]}>
                <BaseSelect
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Gõ tên, mã hoặc CCCD bệnh nhân của chi nhánh…"
                  options={bnOptions}
                  loading={local.isLoading}
                  aria-label="Bệnh nhân"
                />
              </BaseFormItem>

              <BaseRow gutter={16}>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem name="loaiKham" label="Hình thức khám">
                    <BaseSelect
                      options={[
                        { value: 'BAN_DAU', label: 'Khám ban đầu (Phiếu khám mới)' },
                        { value: 'BO_SUNG', label: 'Khám bổ sung (Hội chẩn / Đánh giá CLS)' },
                      ]}
                      onChange={(v) => {
                        if (v === 'BAN_DAU') {
                          form.setFieldsValue({ maPhieuGoc: undefined })
                        } else if (v === 'BO_SUNG' && phieuGocQuery.data?.length === 1) {
                          form.setFieldsValue({ maPhieuGoc: phieuGocQuery.data[0].maLuot })
                        }
                      }}
                    />
                  </BaseFormItem>
                </BaseCol>

                {values.loaiKham === 'BO_SUNG' && (
                  <BaseCol xs={24} md={12}>
                    <BaseFormItem
                      name="maPhieuGoc"
                      label="Phiếu khám gốc (chỉ chọn lần khám đầu tiên)"
                      rules={[{ required: true, message: 'Chọn lần khám ban đầu để liên kết' }]}
                    >
                      <BaseSelect
                        showSearch={{ optionFilterProp: 'label' }}
                        placeholder="Chọn lần khám đầu tiên…"
                        loading={phieuGocQuery.isLoading}
                        options={(phieuGocQuery.data ?? []).map((p) => ({
                          value: p.maLuot,
                          label: `${p.maLuot} — Khám ban đầu ngày ${dateVN(p.thoiGian)} (${p.tenKhoa ?? p.maKhoa} · BS ${p.tenBS ?? p.maBS}${p.benh ? ` · ${p.benh}` : ''})`,
                        }))}
                      />
                    </BaseFormItem>
                  </BaseCol>
                )}
              </BaseRow>

              {values.loaiKham === 'BO_SUNG' && phieuGocQuery.isSuccess && (phieuGocQuery.data ?? []).length === 0 && (
                <BaseAlert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  title="Bệnh nhân chưa có lần khám ban đầu nào tại chi nhánh"
                  description="Khám bổ sung chỉ áp dụng khi bệnh nhân đã có một lần khám ban đầu. Vui lòng chuyển hình thức khám sang 'Khám ban đầu'."
                />
              )}

              {values.loaiKham === 'BO_SUNG' && (
                <BaseAlert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  title="Quy định nghiệp vụ Khám bổ sung"
                  description="Phiếu khám bổ sung được tạo khi cần hội chẩn sang khoa khác hoặc quay lại đọc kết quả xét nghiệm/chẩn đoán hình ảnh. Phiếu bổ sung là độc lập, có thu phí khám và có hóa đơn riêng."
                />
              )}
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
              {maBN && local.data && !localBN && (
                <BaseAlert
                  type="warning"
                  title={`Bệnh nhân ${maBN} chưa có hồ sơ tại ${branch?.shortName ?? site}`}
                  description="Lập hồ sơ ở màn Tiếp đón (nhập số CCCD / thẻ BHYT để dùng lại mã cũ) rồi tạo lượt."
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
                      này; tái khám cho đợt đang mở thì dùng{' '}
                      <Link to={`/luot-chua-moi?maBN=${encodeURIComponent(maBN!)}`}>Tạo lượt chữa</Link>.
                    </>
                  }
                />
              )}
            </BaseCard>

            <BaseCard title="2. Thông tin khám">
              <BaseRow gutter={16}>
                <BaseCol xs={24} md={12}>
                  <BaseFormItem name="maKhoa" label="Khoa" rules={[{ required: true, message: 'Chọn khoa' }]}>
                    <BaseSelect
                      placeholder="Chọn khoa"
                      options={cat.khoa.map((k) => ({ value: k.maKhoa, label: k.tenKhoa }))}
                      onChange={(v) => {
                        const bs = cat.bacSi.find((b) => b.maNV === form.getFieldValue('maBS'))
                        if (bs && bs.maKhoa !== v) form.setFieldsValue({ maBS: undefined })
                        const curYTa: string[] = form.getFieldValue('yTa') ?? []
                        if (curYTa.length > 0) {
                          const valid = curYTa.filter((id) => cat.yTa.some((y) => y.maNV === id && y.maKhoa === v))
                          if (valid.length !== curYTa.length) form.setFieldsValue({ yTa: valid })
                        }
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
                    extra="Chỉ bác sĩ đang làm việc của chi nhánh này"
                  >
                    <BaseSelect
                      showSearch={{ optionFilterProp: 'label' }}
                      placeholder="Chọn bác sĩ"
                      options={bacSiOptions}
                      onChange={(v) => {
                        const bs = cat.bacSi.find((b) => b.maNV === v)
                        if (bs) {
                          form.setFieldsValue({ maKhoa: bs.maKhoa })
                          const curYTa: string[] = form.getFieldValue('yTa') ?? []
                          if (curYTa.length > 0) {
                            const valid = curYTa.filter((id) => cat.yTa.some((y) => y.maNV === id && y.maKhoa === bs.maKhoa))
                            if (valid.length !== curYTa.length) form.setFieldsValue({ yTa: valid })
                          }
                        }
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
                  <BaseFormItem label="Mã lượt" extra="Số thứ tự được sinh tự động khi lưu">
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
              </BaseRow>
            </BaseCard>

            <BaseCard title="3. Chẩn đoán & đợt điều trị">
              <BaseFormList name="chanDoan">
                {(fields, { add, remove }) => (
                  <>
                    {fields.length === 0 ? (
                      <BaseAlert
                        type="info"
                        title="Chưa có chẩn đoán"
                        description="Vẫn lưu được lượt khám không có chẩn đoán (không phát hiện bệnh / chờ kết quả) — khi đó không mở đợt điều trị."
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
                          rules={[{ required: true, message: 'Chọn bệnh' }, khongTrung('chanDoan', 'maBenh', 'Bệnh')]}
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

            <BaseCard title="4. Y tá hỗ trợ">
              {yTaOptions.length === 0 ? (
                <div className="muted" style={{ padding: '8px 0' }}>
                  {maKhoa ? 'Khoa này hiện chưa có y tá đang làm việc.' : 'Vui lòng chọn khoa để xem danh sách y tá.'}
                </div>
              ) : (
                <BaseFormItem name="yTa" style={{ marginBottom: 8 }}>
                  <BaseCheckableTags options={yTaOptions} />
                </BaseFormItem>
              )}
              <div className="muted">
                {soYTa > 0
                  ? `${soYTa} y tá × ${money(THUONG_HO_TRO)} = ${money(soYTa * THUONG_HO_TRO)} thưởng, cộng vào lương tháng.`
                  : 'Chọn y tá tiếp đón / hỗ trợ ca khám. Chỉ hiện y tá đang làm việc thuộc khoa.'}
              </div>
            </BaseCard>

            <BaseCard title="5. Dịch vụ · Thuốc">
              <LuotItemsEditor form={form} catalogs={cat.catalogs} hideThietBi />
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
            hideThietBi
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
