import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { createBenhNhan, deleteBenhNhan, getBenhNhan, tiepDon, updateBenhNhan } from '../api/endpoints'
import type { BenhNhan, BenhNhanRequest } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseCol,
  BaseDatePicker,
  BaseDeleteButton,
  BaseDivider,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseRow,
  BaseSearchInput,
  BaseSelect,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  BaseTextArea,
  BaseWritable,
  ProfileIcon,
  useBaseForm,
  useBaseReadOnly,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { age, blankToNull, dateTimeVN, gomTheoMa } from '../utils/format'

interface FormValues {
  maBN?: string
  hoTen: string
  gioiTinh?: string
  ngaySinh?: Dayjs | null
  cccd?: string
  soDienThoai?: string
  diaChi?: string
  soTheBHYT?: string
  nhomMau?: string
  tienSuDiUng?: string
}

const GIOI_TINH = ['Nam', 'Nữ', 'Khác']
const NHOM_MAU = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/**
 * Bệnh nhân của chi nhánh đang chọn. Mã bệnh nhân là định danh chung toàn chuỗi: bệnh nhân đã khám ở chi nhánh khác →
 * nhập đúng số CCCD / thẻ BHYT, S0 chỉ trả mã cũ (không kèm thông tin cá nhân), thông tin còn lại nhập từ giấy tờ.
 * Mở từ màn Tiếp đón: ?them=1[&maBN=…][&cccd=… | &soTheBHYT=…] điền sẵn các ô đó.
 */
export function BenhNhanPage() {
  const { site, branch } = useSite()
  const readOnly = useBaseReadOnly()
  const navigate = useNavigate()
  const form = useBaseForm<FormValues>()

  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<BenhNhan | null>(null)
  const [open, setOpen] = useState(false)
  const [lookup, setLookup] = useState('')
  const [params, setParams] = useSearchParams()
  /** mở từ màn Tiếp đón (?them=1): lưu xong chuyển sang tạo lượt khám cho bệnh nhân mới */
  const [tuTiepDon, setTuTiepDon] = useState(false)

  const listQuery = useQuery({ queryKey: ['benh-nhan', site, q], queryFn: () => getBenhNhan(site, q) })
  const lookupQuery = useQuery({
    queryKey: ['tiep-don', site, lookup],
    queryFn: () => tiepDon(site, lookup),
    enabled: open && !editing && lookup.trim() !== '',
    retry: false,
  })
  const lookupLocal = (lookupQuery.data?.taiChiNhanh ?? []).filter((b) => b.cccd === lookup || b.soTheBHYT === lookup)

  const crud = useCrudMutations({
    form,
    save: (body: BenhNhanRequest) => (editing ? updateBenhNhan(site, editing.maBN, body) : createBenhNhan(site, body)),
    remove: (maBN: string) => deleteBenhNhan(site, maBN),
    invalidate: [['benh-nhan', site]],
    savedMessage: (saved) => (editing ? `Đã cập nhật ${saved.hoTen}` : `Đã thêm bệnh nhân ${saved.hoTen} (${saved.maBN})`),
    onSaved: (saved) => {
      setOpen(false)
      if (tuTiepDon && !editing) navigate(`/luot-kham-moi?maBN=${encodeURIComponent(saved.maBN)}`)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setLookup('')
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({ gioiTinh: 'Nam' })
    setOpen(true)
  }

  useEffect(() => {
    if (params.get('them') === '1' && !readOnly) {
      setTuTiepDon(true)
      openCreate()
      form.setFieldsValue({
        maBN: params.get('maBN') ?? undefined,
        cccd: params.get('cccd') ?? undefined,
        soTheBHYT: params.get('soTheBHYT') ?? undefined,
      })
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ xử lý tham số ?them=1 khi vào trang
  }, [params])

  const openEdit = (bn: BenhNhan) => {
    setEditing(bn)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({
      maBN: bn.maBN,
      hoTen: bn.hoTen,
      gioiTinh: bn.gioiTinh ?? undefined,
      ngaySinh: bn.ngaySinh ? dayjs(bn.ngaySinh) : null,
      cccd: bn.cccd ?? undefined,
      soDienThoai: bn.soDienThoai ?? undefined,
      diaChi: bn.diaChi ?? undefined,
      soTheBHYT: bn.soTheBHYT ?? undefined,
      nhomMau: bn.nhomMau ?? undefined,
      tienSuDiUng: bn.tienSuDiUng ?? undefined,
    })
    setOpen(true)
  }

  /** Lấy thông tin bệnh nhân đã đăng ký ở chi nhánh khác, giữ nguyên mã để định danh toàn chuỗi. */
  /** Dùng lại mã ở chi nhánh khác: chỉ có mã và số vừa nhập — thông tin cá nhân nhập từ giấy tờ bệnh nhân đưa */
  const dungMa = (maBN: string) =>
    form.setFieldsValue({ maBN, ...(/^\d{12}$/.test(lookup) ? { cccd: lookup } : { soTheBHYT: lookup }) })

  const submit = (v: FormValues) =>
    crud.submit({
      maBN: editing ? editing.maBN : blankToNull(v.maBN),
      hoTen: v.hoTen.trim(),
      gioiTinh: v.gioiTinh ?? null,
      ngaySinh: v.ngaySinh ? v.ngaySinh.format('YYYY-MM-DD') : null,
      cccd: blankToNull(v.cccd),
      soDienThoai: blankToNull(v.soDienThoai),
      diaChi: blankToNull(v.diaChi),
      soTheBHYT: blankToNull(v.soTheBHYT),
      nhomMau: v.nhomMau ?? null,
      tienSuDiUng: blankToNull(v.tienSuDiUng),
    })

  const columns: BaseColumns<BenhNhan> = [
    { title: 'Mã BN', dataIndex: 'maBN', render: (v: string) => <code>{v}</code>, width: 90 },
    {
      title: 'Họ tên',
      render: (_, r) => (
        <>
          <BaseText strong>{r.hoTen}</BaseText>
          <div className="muted">
            {[r.gioiTinh, age(r.ngaySinh) != null ? `${age(r.ngaySinh)} tuổi` : null, r.nhomMau && `Nhóm máu ${r.nhomMau}`]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </>
      ),
    },
    { title: 'CCCD', dataIndex: 'cccd', render: (v: string | null) => (v ? <code>{v}</code> : '—') },
    { title: 'Điện thoại', dataIndex: 'soDienThoai', render: (v: string | null) => (v ? <code>{v}</code> : '—') },
    { title: 'Thẻ BHYT', dataIndex: 'soTheBHYT', render: (v: string | null) => (v ? <code>{v}</code> : '—') },
    { title: 'Lần khám', dataIndex: 'soLanKham', align: 'right', width: 90 },
    {
      title: 'Khám gần nhất',
      dataIndex: 'lanKhamGanNhat',
      render: (v: string | null, r) => (
        <>
          {dateTimeVN(v)}
          {r.soDotDangDieuTri > 0 && (
            <div>
              <BaseTag color="processing">{r.soDotDangDieuTri} đợt đang điều trị</BaseTag>
            </div>
          )}
        </>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 220,
      render: (_, r) => (
        <BaseSpace size={4}>
          <BaseButton type="link" size="small" icon={<ProfileIcon />} onClick={() => navigate(`/ho-so?maBN=${encodeURIComponent(r.maBN)}`)}>
            Hồ sơ
          </BaseButton>
          <BaseEditButton onClick={() => openEdit(r)} />
          <BaseDeleteButton
            title={`Xoá hồ sơ ${r.hoTen}?`}
            description={
              r.soLanKham > 0
                ? `Đã có ${r.soLanKham} lần khám → backend sẽ từ chối xoá (BR9).`
                : 'Chưa khám lần nào → xoá hẳn hồ sơ tại chi nhánh này.'
            }
            disabled={r.soLanKham > 0}
            onConfirm={() => crud.removeById(r.maBN)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Bệnh nhân"
        description={`Hồ sơ bệnh nhân đăng ký tại ${branch?.tenCn ?? site} (BENH_NHAN). Mã bệnh nhân dùng chung toàn chuỗi.`}
        extra={
          <BaseWritable>
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => {
              setTuTiepDon(false)
              openCreate()
            }}>
              Thêm bệnh nhân
            </BaseButton>
          </BaseWritable>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, họ tên, CCCD, điện thoại, thẻ BHYT…" onSearch={(value) => setQ(value)} />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh sách bệnh nhân" error={listQuery.error} />}

      <BaseTable<BenhNhan>
        rowKey="maBN"
        unit="bệnh nhân"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 1100 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa bệnh nhân · ${editing.maBN}` : 'Thêm bệnh nhân'}
        width={760}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
        notice={
          !editing && (
            <>
              <BaseDivider style={{ marginTop: 0 }}>Đã có mã ở chi nhánh khác? Nhập đúng số CCCD / thẻ BHYT</BaseDivider>
              <div className="toolbar">
                <BaseSearchInput placeholder="Số CCCD (12 số) hoặc số thẻ BHYT trên giấy tờ…" onSearch={(v) => setLookup(v.trim())} enterButton="Tra mã" />
              </div>
              {lookupQuery.error && <BaseErrorAlert title="Không tra cứu được" error={lookupQuery.error} />}
              {lookupQuery.data?.canhBao && <BaseAlert type="warning" title={lookupQuery.data.canhBao} style={{ marginBottom: 8 }} />}
              {lookup !== '' && lookupQuery.data && (
                lookupLocal.length > 0 ? (
                  <BaseAlert
                    type="warning"
                    style={{ marginBottom: 16 }}
                    title={`Đã có hồ sơ tại chi nhánh này: ${lookupLocal.map((b) => `${b.maBN} · ${b.hoTen}`).join(', ')}`}
                  />
                ) : lookupQuery.data.noiKhac.length > 0 ? (
                  gomTheoMa(lookupQuery.data.noiKhac).map(([maBN, chiNhanh]) => (
                    <BaseAlert
                      key={maBN}
                      type="success"
                      style={{ marginBottom: 16 }}
                      title={`Số này đã có mã ${maBN} (có hồ sơ tại chi nhánh ${chiNhanh.join(', ')})`}
                      description="Chỉ biết mã — họ tên, ngày sinh, địa chỉ… nhập từ giấy tờ bệnh nhân đưa."
                      action={<BaseButton size="small" onClick={() => dungMa(maBN)}>Dùng mã này</BaseButton>}
                    />
                  ))
                ) : lookupQuery.data.daTraToanChuoi ? (
                  <BaseAlert type="info" style={{ marginBottom: 16 }} title="Chưa có trong chuỗi — để trống mã để hệ thống cấp mã mới." />
                ) : (
                  <BaseAlert type="info" style={{ marginBottom: 16 }} title="Nhập đúng số CCCD hoặc số thẻ BHYT để tra trên toàn chuỗi." />
                )
              )}
            </>
          )
        }
      >
        <BaseDivider style={editing ? { marginTop: 0 } : undefined}>
          Thông tin bệnh nhân · <code>BENH_NHAN</code>
        </BaseDivider>
        <BaseRow>
          <BaseCol xs={24} md={12}>
            <BaseFormItem
              label="Mã bệnh nhân"
              name="maBN"
              extra={editing ? undefined : `Để trống để tự sinh BN-${branch?.maCn ?? 'CN'}-0001… — mã mang mã chi nhánh nên không trùng toàn chuỗi, sinh được cả khi mất kết nối Trung tâm`}
            >
              <BaseInput disabled={!!editing} placeholder={`BN-${branch?.maCn ?? 'CN'}-…`} maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Họ tên" name="hoTen" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
              <BaseInput maxLength={100} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Giới tính" name="gioiTinh">
              <BaseSelect options={GIOI_TINH} allowClear />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Ngày sinh" name="ngaySinh">
              <BaseDatePicker disableFuture />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Nhóm máu" name="nhomMau">
              <BaseSelect options={NHOM_MAU} allowClear />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="CCCD" name="cccd" rules={[{ pattern: /^\d{12}$/, message: 'CCCD gồm 12 chữ số' }]}>
              <BaseInput maxLength={12} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem
              label="Số điện thoại"
              name="soDienThoai"
              rules={[{ pattern: /^[0-9+ .-]{8,20}$/, message: 'Số điện thoại không hợp lệ' }]}
            >
              <BaseInput maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Số thẻ BHYT" name="soTheBHYT">
              <BaseInput maxLength={30} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24}>
            <BaseFormItem label="Địa chỉ" name="diaChi">
              <BaseInput maxLength={255} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24}>
            <BaseFormItem label="Tiền sử dị ứng" name="tienSuDiUng">
              <BaseTextArea maxLength={2000} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
      </BaseFormModal>
    </>
  )
}
