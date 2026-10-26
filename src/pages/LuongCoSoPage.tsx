import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { createLuongCoSo, deleteLuongCoSo, getLuongCoSo, updateLuongCoSo } from '../api/endpoints'
import type { LuongCoSo, LuongCoSoRequest, TrangThaiLuongCoSo } from '../api/types'
import {
  AddIcon,
  BaseAlert,
  BaseButton,
  BaseDatePicker,
  BaseDeleteButton,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseMoneyInput,
  BaseSpace,
  BaseTable,
  BaseTag,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { blankToNull, dateVN, money } from '../utils/format'

interface FormValues {
  ngayApDung: Dayjs
  mucLuong: number
  vanBanQuyDinh?: string
}

const TRANG_THAI: Record<TrangThaiLuongCoSo, { label: string; color: string }> = {
  DANG_AP_DUNG: { label: 'Đang áp dụng', color: 'green' },
  SAP_AP_DUNG: { label: 'Sắp áp dụng', color: 'blue' },
  DA_THAY_THE: { label: 'Đã thay thế', color: 'default' },
}

/**
 * Lương cơ sở — danh mục chung có lịch sử, ghi tại S0. Lương tháng = hệ số × mức có hiệu lực trong tháng,
 * nên mức đã áp dụng chỉ đọc; chỉ mức "Sắp áp dụng" được sửa / xoá.
 */
export function LuongCoSoPage() {
  const form = useBaseForm<FormValues>()
  const [editing, setEditing] = useState<LuongCoSo | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({ queryKey: ['luong-co-so'], queryFn: getLuongCoSo })

  const crud = useCrudMutations({
    form,
    save: (body: LuongCoSoRequest) => (editing ? updateLuongCoSo(editing.ngayApDung, body) : createLuongCoSo(body)),
    remove: deleteLuongCoSo,
    invalidate: [['luong-co-so']],
    savedMessage: (saved) => `Đã lưu mức ${money(saved.mucLuong)} áp dụng từ ${dateVN(saved.ngayApDung)} tại S0`,
    onSaved: () => setOpen(false),
  })

  const openForm = (row: LuongCoSo | null) => {
    setEditing(row)
    crud.setSaveError(null)
    form.resetFields()
    if (row) {
      form.setFieldsValue({ ngayApDung: dayjs(row.ngayApDung), mucLuong: row.mucLuong, vanBanQuyDinh: row.vanBanQuyDinh ?? undefined })
    } else {
      form.setFieldsValue({ ngayApDung: dayjs().add(1, 'month').startOf('month') })
    }
    setOpen(true)
  }

  const submit = (v: FormValues) =>
    crud.submit({ ngayApDung: v.ngayApDung.format('YYYY-MM-DD'), mucLuong: v.mucLuong, vanBanQuyDinh: blankToNull(v.vanBanQuyDinh) })

  const columns: BaseColumns<LuongCoSo> = [
    { title: 'Áp dụng từ', dataIndex: 'ngayApDung', render: (v: string) => <strong>{dateVN(v)}</strong>, width: 140 },
    { title: 'Mức lương cơ sở', dataIndex: 'mucLuong', align: 'right', render: money, width: 170 },
    { title: 'Văn bản quy định', dataIndex: 'vanBanQuyDinh', render: (v: string | null) => v ?? '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 140,
      render: (v: TrangThaiLuongCoSo) => <BaseTag color={TRANG_THAI[v].color}>{TRANG_THAI[v].label}</BaseTag>,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, r) => {
        const locked = r.trangThai !== 'SAP_AP_DUNG'
        return (
          <BaseSpace size={4}>
            <BaseEditButton disabled={locked} onClick={() => openForm(r)} />
            <BaseDeleteButton
              title={`Xoá mức áp dụng từ ${dateVN(r.ngayApDung)}?`}
              description="Mức chưa có hiệu lực nên xoá được."
              disabled={locked}
              onConfirm={() => crud.removeById(r.ngayApDung)}
            />
          </BaseSpace>
        )
      },
    },
  ]

  return (
    <>
      <PageTitle
        title="Lương cơ sở"
        hub
        description="Mức lương cơ sở theo từng thời kỳ, ghi tại S0 và đồng bộ xuống chi nhánh để tính lương (lương = hệ số × mức có hiệu lực trong tháng)."
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
            Thêm mức mới
          </BaseButton>
        }
      />

      <BaseAlert
        type="info"
        title="Mức đã có hiệu lực là dữ liệu lịch sử"
        description="Muốn đổi lương cơ sở thì thêm mức mới với ngày áp dụng mới — không sửa / xoá mức cũ, để lương các tháng đã qua không bị tính lại."
      />

      {listQuery.error && <BaseErrorAlert title="Không tải được lương cơ sở từ S0" error={listQuery.error} />}

      <BaseTable<LuongCoSo>
        rowKey="ngayApDung"
        unit="mức"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 700 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa mức áp dụng từ ${dateVN(editing.ngayApDung)}` : 'Thêm mức lương cơ sở'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
      >
        <BaseFormItem label="Ngày áp dụng" name="ngayApDung" rules={[{ required: true, message: 'Chọn ngày áp dụng' }]}>
          <BaseDatePicker disabled={!!editing} />
        </BaseFormItem>
        <BaseFormItem label="Mức lương (₫)" name="mucLuong" rules={[{ required: true, message: 'Nhập mức lương' }]}>
          <BaseMoneyInput min={1} step={10000} />
        </BaseFormItem>
        <BaseFormItem label="Văn bản quy định" name="vanBanQuyDinh">
          <BaseInput maxLength={255} placeholder="VD: Nghị định 73/2024/NĐ-CP" />
        </BaseFormItem>
      </BaseFormModal>
    </>
  )
}
