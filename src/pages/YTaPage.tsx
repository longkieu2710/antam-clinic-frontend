import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { createYTa, deleteYTa, getKhoa, getYTa, updateYTa } from '../api/endpoints'
import type { YTa, YTaRequest } from '../api/types'
import {
  AddIcon,
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
  BaseNumberInput,
  BaseRow,
  BaseSearchInput,
  BaseSelect,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseTagsInput,
  BaseText,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { age, blankToNull } from '../utils/format'

interface FormValues {
  maNV?: string
  hoTen: string
  gioiTinh?: string
  ngaySinh?: Dayjs | null
  cccd?: string
  maKhoa: string
  heSoLuong: number
  ngayVaoLam?: Dayjs | null
  trangThai: string
  diaChi?: string
  trinhDo?: string
  soChungChiHanhNghe?: string
  soDienThoai: string[]
}

const GIOI_TINH = ['Nam', 'Nữ', 'Khác']
const TRINH_DO = ['Trung cấp Điều dưỡng', 'Cao đẳng Điều dưỡng', 'Cử nhân Điều dưỡng', 'Thạc sĩ Điều dưỡng']
const TRANG_THAI = ['Đang làm việc', 'Ngừng hoạt động']

const toDate = (d?: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : null)

/**
 * Y tá của chi nhánh đang chọn.
 * Thêm = 1 transaction: INSERT NHAN_VIEN → Y_TA → NV_SODIENTHOAI.
 * Xoá y tá đã hỗ trợ lượt khám/chữa → backend chuyển "Ngừng hoạt động" (BR9).
 */
export function YTaPage() {
  const { site, branch } = useSite()
  const form = useBaseForm<FormValues>()

  const [q, setQ] = useState('')
  const [khoa, setKhoa] = useState<string | undefined>()
  const [editing, setEditing] = useState<YTa | null>(null)
  const [open, setOpen] = useState(false)

  const khoaQuery = useQuery({ queryKey: ['khoa', site], queryFn: () => getKhoa(site) })
  const listQuery = useQuery({ queryKey: ['y-ta', site, q, khoa], queryFn: () => getYTa(site, q, khoa) })

  const crud = useCrudMutations({
    form,
    save: (body: YTaRequest) => (editing ? updateYTa(site, editing.maNV, body) : createYTa(site, body)),
    remove: (maNV: string) => deleteYTa(site, maNV),
    invalidate: [['y-ta', site], ['khoa', site]],
    savedMessage: (saved) =>
      editing ? `Đã cập nhật ${saved.hoTen}` : `Đã thêm y tá ${saved.hoTen} (${saved.maNV}) — 1 transaction: NHAN_VIEN → Y_TA → NV_SODIENTHOAI`,
    onSaved: () => setOpen(false),
  })

  const openCreate = () => {
    setEditing(null)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({ heSoLuong: 2.34, trangThai: 'Đang làm việc', gioiTinh: 'Nữ', soDienThoai: [], ngayVaoLam: dayjs() })
    setOpen(true)
  }

  const openEdit = (yt: YTa) => {
    setEditing(yt)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({
      ...yt,
      gioiTinh: yt.gioiTinh ?? undefined,
      cccd: yt.cccd ?? undefined,
      diaChi: yt.diaChi ?? undefined,
      trinhDo: yt.trinhDo ?? undefined,
      soChungChiHanhNghe: yt.soChungChiHanhNghe ?? undefined,
      trangThai: yt.trangThai ?? 'Đang làm việc',
      ngaySinh: yt.ngaySinh ? dayjs(yt.ngaySinh) : null,
      ngayVaoLam: yt.ngayVaoLam ? dayjs(yt.ngayVaoLam) : null,
    })
    setOpen(true)
  }

  const submit = (v: FormValues) =>
    crud.submit({
      maNV: editing ? editing.maNV : blankToNull(v.maNV),
      hoTen: v.hoTen.trim(),
      gioiTinh: v.gioiTinh ?? null,
      ngaySinh: toDate(v.ngaySinh),
      cccd: blankToNull(v.cccd),
      maKhoa: v.maKhoa,
      heSoLuong: v.heSoLuong,
      ngayVaoLam: toDate(v.ngayVaoLam),
      trangThai: v.trangThai,
      diaChi: blankToNull(v.diaChi),
      trinhDo: blankToNull(v.trinhDo),
      soChungChiHanhNghe: blankToNull(v.soChungChiHanhNghe),
      soDienThoai: (v.soDienThoai ?? []).map((s) => s.trim()).filter(Boolean),
    })

  const khoaOptions = (khoaQuery.data ?? []).map((k) => ({ value: k.maKhoa, label: k.tenKhoa }))

  const columns: BaseColumns<YTa> = [
    { title: 'Mã YT', dataIndex: 'maNV', render: (v: string) => <code>{v}</code>, width: 120 },
    {
      title: 'Họ tên',
      render: (_, r) => (
        <>
          <BaseText strong>{r.hoTen}</BaseText>
          <div className="muted">
            {[r.trinhDo, r.gioiTinh, age(r.ngaySinh) != null ? `${age(r.ngaySinh)} tuổi` : null].filter(Boolean).join(' · ')}
          </div>
        </>
      ),
    },
    { title: 'Khoa', dataIndex: 'tenKhoa', render: (v: string | null, r) => v ?? r.maKhoa },
    { title: 'Hệ số', dataIndex: 'heSoLuong', align: 'right', render: (v: number) => v.toFixed(2), width: 80 },
    {
      title: 'Điện thoại',
      dataIndex: 'soDienThoai',
      render: (v: string[]) => (v.length ? v.map((p) => <div key={p}><code>{p}</code></div>) : '—'),
    },
    { title: 'Lượt hỗ trợ', dataIndex: 'soLanHoTro', align: 'right', width: 110 },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: (v: string | null) => <BaseTag color={v === 'Ngừng hoạt động' ? 'default' : 'green'}>{v ?? '—'}</BaseTag>,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, r) => (
        <BaseSpace size={4}>
          <BaseEditButton onClick={() => openEdit(r)} />
          <BaseDeleteButton
            title={`Xoá ${r.hoTen}?`}
            description={
              r.soLanHoTro > 0
                ? `Đã hỗ trợ ${r.soLanHoTro} lượt khám/chữa → sẽ chuyển "Ngừng hoạt động" thay vì xoá (BR9).`
                : 'Chưa hỗ trợ lượt nào → xoá hẳn khỏi CSDL.'
            }
            okText={r.soLanHoTro > 0 ? 'Chuyển ngừng hoạt động' : 'Xoá'}
            danger={r.soLanHoTro === 0}
            onConfirm={() => crud.removeById(r.maNV)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Y tá"
        description={`Nhân viên loại YT của ${branch?.tenCn ?? site} (NHAN_VIEN ⟶ Y_TA). Mỗi lượt hỗ trợ được thưởng 200.000 ₫ khi tính lương.`}
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={openCreate}>
            Thêm y tá
          </BaseButton>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, họ tên, CCCD, số CCHN…" onSearch={(value) => setQ(value)} />
        <BaseSelect
          placeholder="Khoa: tất cả"
          allowClear
          value={khoa}
          onChange={setKhoa}
          options={khoaOptions}
          loading={khoaQuery.isLoading}
          style={{ minWidth: 220 }}
        />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh sách y tá" error={listQuery.error} />}

      <BaseTable<YTa>
        rowKey="maNV"
        unit="y tá"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 900 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa y tá · ${editing.maNV}` : 'Thêm y tá'}
        width={760}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
      >
        <BaseDivider style={{ marginTop: 0 }}>
          Thông tin nhân viên · <code>NHAN_VIEN</code>
        </BaseDivider>
        <BaseRow>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Mã nhân viên" name="maNV" extra={editing ? undefined : 'Để trống để hệ thống tự sinh'}>
              <BaseInput disabled={!!editing} placeholder={`YT-${branch?.maCn ?? 'CN'}-..`} maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Họ tên" name="hoTen" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
              <BaseInput maxLength={100} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Giới tính" name="gioiTinh">
              <BaseSelect options={GIOI_TINH} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Ngày sinh" name="ngaySinh">
              <BaseDatePicker disableFuture />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="CCCD" name="cccd" rules={[{ pattern: /^\d{12}$/, message: 'CCCD gồm 12 chữ số' }]}>
              <BaseInput maxLength={12} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Khoa" name="maKhoa" rules={[{ required: true, message: 'Chọn khoa' }]}>
              <BaseSelect options={khoaOptions} loading={khoaQuery.isLoading} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Hệ số lương" name="heSoLuong" rules={[{ required: true, message: 'Nhập hệ số lương' }]} extra="Lương = hệ số × lương cơ sở">
              <BaseNumberInput min={0.01} max={99.99} step={0.01} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Ngày vào làm" name="ngayVaoLam">
              <BaseDatePicker />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Trạng thái" name="trangThai" rules={[{ required: true }]}>
              <BaseSelect options={TRANG_THAI} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Địa chỉ" name="diaChi">
              <BaseInput maxLength={255} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>

        <BaseDivider>
          Thông tin y tá · <code>Y_TA</code>
        </BaseDivider>
        <BaseRow>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Trình độ" name="trinhDo">
              <BaseSelect allowClear options={TRINH_DO} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Số chứng chỉ hành nghề" name="soChungChiHanhNghe">
              <BaseInput maxLength={50} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>

        <BaseDivider>
          Số điện thoại · <code>NV_SODIENTHOAI</code> (đa trị)
        </BaseDivider>
        <BaseFormItem name="soDienThoai" extra="Gõ số rồi Enter để thêm; mỗi số là 1 dòng trong NV_SODIENTHOAI">
          <BaseTagsInput placeholder="VD: 0912345678" />
        </BaseFormItem>
      </BaseFormModal>
    </>
  )
}
