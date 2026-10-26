import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { createBacSi, deleteBacSi, getBacSi, getKhoa, updateBacSi } from '../api/endpoints'
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
import type { BacSi, BacSiRequest } from '../api/types'
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
  hocVi?: string
  chuyenKhoa?: string
  soChungChiHanhNghe?: string
  soDienThoai: string[]
}

const GIOI_TINH = ['Nam', 'Nữ', 'Khác']
const HOC_VI = ['Bác sĩ', 'Thạc sĩ Bác sĩ', 'BS CKI', 'BS CKII', 'Tiến sĩ']
const TRANG_THAI = ['Đang làm việc', 'Ngừng hoạt động']

const toDate = (d?: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : null)

/**
 * Bác sĩ của chi nhánh đang chọn.
 * Thêm = 1 transaction: INSERT NHAN_VIEN → BAC_SI → NV_SODIENTHOAI.
 * Xoá bác sĩ đã có lượt → backend chuyển "Ngừng hoạt động" (BR9).
 */
export function BacSiPage() {
  const { site, branch } = useSite()
  const form = useBaseForm<FormValues>()

  const [q, setQ] = useState('')
  const [khoa, setKhoa] = useState<string | undefined>()
  const [editing, setEditing] = useState<BacSi | null>(null)
  const [open, setOpen] = useState(false)

  const khoaQuery = useQuery({ queryKey: ['khoa', site], queryFn: () => getKhoa(site) })
  const listQuery = useQuery({ queryKey: ['bac-si', site, q, khoa], queryFn: () => getBacSi(site, q, khoa) })

  const crud = useCrudMutations({
    form,
    save: (body: BacSiRequest) => (editing ? updateBacSi(site, editing.maNV, body) : createBacSi(site, body)),
    remove: (maNV: string) => deleteBacSi(site, maNV),
    invalidate: [['bac-si', site], ['khoa', site]],
    savedMessage: (saved) =>
      editing ? `Đã cập nhật ${saved.hoTen}` : `Đã thêm bác sĩ ${saved.hoTen} (${saved.maNV}) — 1 transaction: NHAN_VIEN → BAC_SI → NV_SODIENTHOAI`,
    onSaved: () => setOpen(false),
  })

  const openCreate = () => {
    setEditing(null)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({ heSoLuong: 2.34, trangThai: 'Đang làm việc', gioiTinh: 'Nam', soDienThoai: [], ngayVaoLam: dayjs() })
    setOpen(true)
  }

  const openEdit = (bs: BacSi) => {
    setEditing(bs)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue({
      ...bs,
      gioiTinh: bs.gioiTinh ?? undefined,
      cccd: bs.cccd ?? undefined,
      diaChi: bs.diaChi ?? undefined,
      hocVi: bs.hocVi ?? undefined,
      chuyenKhoa: bs.chuyenKhoa ?? undefined,
      soChungChiHanhNghe: bs.soChungChiHanhNghe ?? undefined,
      trangThai: bs.trangThai ?? 'Đang làm việc',
      ngaySinh: bs.ngaySinh ? dayjs(bs.ngaySinh) : null,
      ngayVaoLam: bs.ngayVaoLam ? dayjs(bs.ngayVaoLam) : null,
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
      hocVi: blankToNull(v.hocVi),
      chuyenKhoa: blankToNull(v.chuyenKhoa),
      soChungChiHanhNghe: blankToNull(v.soChungChiHanhNghe),
      soDienThoai: (v.soDienThoai ?? []).map((s) => s.trim()).filter(Boolean),
    })

  const khoaOptions = (khoaQuery.data ?? []).map((k) => ({ value: k.maKhoa, label: k.tenKhoa }))

  const columns: BaseColumns<BacSi> = [
    { title: 'Mã BS', dataIndex: 'maNV', render: (v: string) => <code>{v}</code>, width: 120 },
    {
      title: 'Họ tên',
      render: (_, r) => (
        <>
          <BaseText strong>{r.hoTen}</BaseText>
          <div className="muted">
            {[r.hocVi, r.gioiTinh, age(r.ngaySinh) != null ? `${age(r.ngaySinh)} tuổi` : null].filter(Boolean).join(' · ')}
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
    { title: 'Số lượt', dataIndex: 'soLuot', align: 'right', width: 90 },
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
              r.soLuot > 0
                ? `Đã có ${r.soLuot} lượt khám/chữa → sẽ chuyển "Ngừng hoạt động" thay vì xoá (BR9).`
                : 'Chưa có lượt nào → xoá hẳn khỏi CSDL.'
            }
            okText={r.soLuot > 0 ? 'Chuyển ngừng hoạt động' : 'Xoá'}
            danger={r.soLuot === 0}
            onConfirm={() => crud.removeById(r.maNV)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Bác sĩ"
        description={`Nhân viên loại BS của ${branch?.tenCn ?? site} (NHAN_VIEN ⟶ BAC_SI).`}
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={openCreate}>
            Thêm bác sĩ
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

      {listQuery.error && <BaseErrorAlert title="Không tải được danh sách bác sĩ" error={listQuery.error} />}

      <BaseTable<BacSi>
        rowKey="maNV"
        unit="bác sĩ"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 900 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa bác sĩ · ${editing.maNV}` : 'Thêm bác sĩ'}
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
              <BaseInput disabled={!!editing} placeholder={`BS-${branch?.maCn ?? 'CN'}-..`} maxLength={20} />
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
          Thông tin bác sĩ · <code>BAC_SI</code>
        </BaseDivider>
        <BaseRow>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Học vị" name="hocVi">
              <BaseSelect allowClear options={HOC_VI} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Chuyên khoa" name="chuyenKhoa">
              <BaseInput maxLength={100} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
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
