import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createDichVu, deleteDichVu, getDichVuMaster, updateDichVu } from '../api/endpoints'
import type { DichVu, DichVuRequest } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseCol,
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
  BaseTooltip,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { blankToNull, money } from '../utils/format'

/** Giá trị "Khám bệnh" được báo cáo doanh thu tính là tiền khám; loại khác là dịch vụ y tế. */
const LOAI_DV = ['Khám bệnh', 'Xét nghiệm', 'Chẩn đoán hình ảnh', 'Thủ thuật', 'Khác']
const DON_VI = ['Lần', 'Gói', 'Giờ']

/** Dịch vụ y tế — danh mục chung: đọc/ghi tại S0, Logical Replication đẩy xuống S1..S3. */
export function DichVuPage() {
  const form = useBaseForm<DichVuRequest>()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<DichVu | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({ queryKey: ['dich-vu-master', q], queryFn: () => getDichVuMaster(q) })

  const crud = useCrudMutations({
    form,
    save: (body: DichVuRequest) => (editing ? updateDichVu(editing.maDV, body) : createDichVu(body)),
    remove: deleteDichVu,
    invalidate: [['dich-vu-master']],
    savedMessage: (saved) => `Đã lưu ${saved.maDV} tại S0 — đang đồng bộ xuống 3 chi nhánh`,
    onSaved: () => setOpen(false),
  })

  const openForm = (d: DichVu | null) => {
    setEditing(d)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue(d ? { ...d, loaiDV: d.loaiDV ?? undefined } : { donViTinh: 'Lần', donGia: 0, loaiDV: 'Xét nghiệm' })
    setOpen(true)
  }

  const submit = (v: DichVuRequest) =>
    crud.submit({
      maDV: editing ? editing.maDV : blankToNull(v.maDV),
      tenDV: v.tenDV.trim(),
      loaiDV: v.loaiDV ?? null,
      donViTinh: v.donViTinh,
      donGia: v.donGia,
    })

  const columns: BaseColumns<DichVu> = [
    { title: 'Mã', dataIndex: 'maDV', render: (v: string) => <code>{v}</code>, width: 90 },
    {
      title: 'Dịch vụ',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenDV}</BaseText>
          {r.loaiDV && (
            <div>
              <BaseTag color={r.loaiDV === 'Khám bệnh' ? 'blue' : 'default'}>{r.loaiDV}</BaseTag>
            </div>
          )}
        </>
      ),
    },
    { title: 'ĐVT', dataIndex: 'donViTinh', width: 80 },
    { title: 'Đơn giá', dataIndex: 'donGia', align: 'right', render: money, width: 130 },
    {
      title: 'Đã dùng (toàn chuỗi)',
      dataIndex: 'soLanSuDung',
      align: 'right',
      width: 170,
      render: (v: number | null) =>
        v == null ? (
          <BaseTooltip title="Không đọc được view SU_DUNG_DV tại S0 (một chi nhánh đang tắt)">
            <BaseTag>?</BaseTag>
          </BaseTooltip>
        ) : (
          `${v} lượt`
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, r) => (
        <BaseSpace size={4}>
          <BaseEditButton onClick={() => openForm(r)} />
          <BaseDeleteButton
            title={`Xoá ${r.tenDV}?`}
            description="Backend kiểm tra dịch vụ đã được dùng ở chi nhánh nào chưa (view SU_DUNG_DV tại S0) rồi mới xoá."
            disabled={(r.soLanSuDung ?? 0) > 0}
            onConfirm={() => crud.removeById(r.maDV)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Dịch vụ y tế"
        hub
        description="Danh mục dịch vụ và bảng giá dùng chung toàn chuỗi. Ghi tại S0, Logical Replication tự đẩy xuống S1, S2, S3."
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
            Thêm dịch vụ
          </BaseButton>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên, loại dịch vụ…" onSearch={setQ} />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh mục dịch vụ từ S0" error={listQuery.error} />}

      <BaseTable<DichVu>
        rowKey="maDV"
        unit="dịch vụ"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 800 }}
      />

      <BaseFormModal<DichVuRequest>
        open={open}
        title={editing ? `Sửa dịch vụ · ${editing.maDV}` : 'Thêm dịch vụ'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
        notice={
          editing && (
            <BaseAlert type="info" title="Đổi đơn giá không ảnh hưởng lượt đã dùng" description="SU_DUNG_DV lưu DonGiaApDung tại thời điểm dùng (BR7)." />
          )
        }
      >
        <BaseRow>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Mã dịch vụ" name="maDV" extra={editing ? undefined : 'Để trống để tự sinh'}>
              <BaseInput disabled={!!editing} maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={16}>
            <BaseFormItem label="Tên dịch vụ" name="tenDV" rules={[{ required: true, whitespace: true, message: 'Nhập tên dịch vụ' }]}>
              <BaseInput maxLength={150} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Loại dịch vụ" name="loaiDV" extra='"Khám bệnh" = tiền khám trong báo cáo doanh thu'>
              <BaseSelect options={LOAI_DV} allowClear />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Đơn vị tính" name="donViTinh" rules={[{ required: true, message: 'Chọn đơn vị tính' }]}>
              <BaseSelect options={DON_VI} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Đơn giá (₫)" name="donGia" rules={[{ required: true, message: 'Nhập đơn giá' }]}>
              <BaseMoneyInput />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
      </BaseFormModal>
    </>
  )
}
