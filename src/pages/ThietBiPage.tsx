import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { createThietBi, deleteThietBi, getThietBi, updateThietBi } from '../api/endpoints'
import type { ThietBi, ThietBiRequest } from '../api/types'
import {
  AddIcon,
  BaseButton,
  BaseCol,
  BaseDatePicker,
  BaseDeleteButton,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseMoneyInput,
  BaseRow,
  BaseSearchInput,
  BaseSelect,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { blankToNull, dateVN, money } from '../utils/format'

interface FormValues {
  maTB?: string
  tenTB: string
  loaiTB?: string
  donGiaSuDung: number
  ngayMua?: Dayjs | null
  tinhTrang?: string
}

const LOAI_TB = ['Chẩn đoán hình ảnh', 'Xét nghiệm', 'Thủ thuật', 'Theo dõi', 'Vật lý trị liệu']
const TINH_TRANG = ['Hoạt động tốt', 'Đang bảo trì', 'Hỏng', 'Ngừng hoạt động']

const tinhTrangColor = (v: string | null) =>
  v === 'Hoạt động tốt' ? 'green' : v === 'Ngừng hoạt động' ? 'default' : v === 'Hỏng' ? 'red' : 'orange'

/** Thiết bị y tế của chi nhánh đang chọn. Thiết bị đã dùng trong lượt khám/chữa → xoá = chuyển "Ngừng hoạt động" (BR9). */
export function ThietBiPage() {
  const { site, branch } = useSite()
  const form = useBaseForm<FormValues>()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<ThietBi | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({ queryKey: ['thiet-bi', site, q], queryFn: () => getThietBi(site, q) })

  const crud = useCrudMutations({
    form,
    save: (body: ThietBiRequest) => (editing ? updateThietBi(site, editing.maTB, body) : createThietBi(site, body)),
    remove: (maTB: string) => deleteThietBi(site, maTB),
    invalidate: [['thiet-bi', site]],
    savedMessage: (saved) => (editing ? `Đã cập nhật ${saved.tenTB}` : `Đã thêm thiết bị ${saved.tenTB} (${saved.maTB})`),
    onSaved: () => setOpen(false),
  })

  const openForm = (tb: ThietBi | null) => {
    setEditing(tb)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue(
      tb
        ? {
            maTB: tb.maTB,
            tenTB: tb.tenTB,
            loaiTB: tb.loaiTB ?? undefined,
            donGiaSuDung: tb.donGiaSuDung,
            ngayMua: tb.ngayMua ? dayjs(tb.ngayMua) : null,
            tinhTrang: tb.tinhTrang ?? undefined,
          }
        : { donGiaSuDung: 0, tinhTrang: 'Hoạt động tốt' },
    )
    setOpen(true)
  }

  const submit = (v: FormValues) =>
    crud.submit({
      maTB: editing ? editing.maTB : blankToNull(v.maTB),
      tenTB: v.tenTB.trim(),
      loaiTB: v.loaiTB ?? null,
      donGiaSuDung: v.donGiaSuDung,
      ngayMua: v.ngayMua ? v.ngayMua.format('YYYY-MM-DD') : null,
      tinhTrang: v.tinhTrang ?? null,
    })

  const columns: BaseColumns<ThietBi> = [
    { title: 'Mã', dataIndex: 'maTB', render: (v: string) => <code>{v}</code>, width: 120 },
    {
      title: 'Thiết bị',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenTB}</BaseText>
          {r.loaiTB && <div className="muted">{r.loaiTB}</div>}
        </>
      ),
    },
    { title: 'Đơn giá sử dụng', dataIndex: 'donGiaSuDung', align: 'right', render: money, width: 150 },
    { title: 'Ngày mua', dataIndex: 'ngayMua', render: dateVN, width: 120 },
    { title: 'Đã dùng', dataIndex: 'soLanSuDung', align: 'right', render: (v: number) => `${v} lần`, width: 100 },
    { title: 'Tình trạng', dataIndex: 'tinhTrang', render: (v: string | null) => <BaseTag color={tinhTrangColor(v)}>{v ?? '—'}</BaseTag> },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, r) => (
        <BaseSpace size={4}>
          <BaseEditButton onClick={() => openForm(r)} />
          <BaseDeleteButton
            title={`Xoá ${r.tenTB}?`}
            description={
              r.soLanSuDung > 0
                ? `Đã dùng ${r.soLanSuDung} lần trong lượt khám/chữa → sẽ chuyển "Ngừng hoạt động" thay vì xoá (BR9).`
                : 'Chưa dùng lần nào → xoá hẳn khỏi CSDL.'
            }
            okText={r.soLanSuDung > 0 ? 'Chuyển ngừng hoạt động' : 'Xoá'}
            danger={r.soLanSuDung === 0}
            onConfirm={() => crud.removeById(r.maTB)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Thiết bị"
        description={`Thiết bị y tế của ${branch?.tenCn ?? site} (THIET_BI). Đổi đơn giá không ảnh hưởng lượt cũ — SU_DUNG_TB lưu đơn giá áp dụng (BR7).`}
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
            Thêm thiết bị
          </BaseButton>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên, loại thiết bị…" onSearch={setQ} />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh sách thiết bị" error={listQuery.error} />}

      <BaseTable<ThietBi>
        rowKey="maTB"
        unit="thiết bị"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 900 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa thiết bị · ${editing.maTB}` : 'Thêm thiết bị'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
      >
        <BaseRow>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Mã thiết bị" name="maTB" extra={editing ? undefined : 'Để trống để tự sinh'}>
              <BaseInput disabled={!!editing} maxLength={20} placeholder={`TB-${branch?.maCn ?? 'CN'}-..`} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={16}>
            <BaseFormItem label="Tên thiết bị" name="tenTB" rules={[{ required: true, whitespace: true, message: 'Nhập tên thiết bị' }]}>
              <BaseInput maxLength={150} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Loại thiết bị" name="loaiTB">
              <BaseSelect options={LOAI_TB} allowClear />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Đơn giá sử dụng (₫ / lần)" name="donGiaSuDung" rules={[{ required: true, message: 'Nhập đơn giá' }]}>
              <BaseMoneyInput />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Ngày mua" name="ngayMua">
              <BaseDatePicker disableFuture />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Tình trạng" name="tinhTrang">
              <BaseSelect options={TINH_TRANG} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
      </BaseFormModal>
    </>
  )
}
