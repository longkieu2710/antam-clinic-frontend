import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createKhoa, deleteKhoa, getKhoa, getKhoaToanChuoi, updateKhoa } from '../api/endpoints'
import type { Khoa, KhoaRequest } from '../api/types'
import {
  AddIcon,
  BaseButton,
  BaseDeleteButton,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  BaseTextArea,
  BaseWritable,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { useTenChiNhanh } from '../site/useTenChiNhanh'
import { blankToNull } from '../utils/format'

interface FormValues {
  maKhoa?: string
  tenKhoa: string
  moTa?: string
}

/** Khoa của chi nhánh đang chọn (KHOA.MaCN = chi nhánh). Khoa còn nhân viên hoặc đã có lượt thì không xoá được. */
export function KhoaPage() {
  const { mode, site, branch } = useSite()
  const hq = mode === 'HQ'
  const tenCn = useTenChiNhanh()
  const form = useBaseForm<FormValues>()
  const [editing, setEditing] = useState<Khoa | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({
    queryKey: hq ? ['khoa-toan-chuoi'] : ['khoa', site],
    queryFn: () => (hq ? getKhoaToanChuoi() : getKhoa(site)),
  })

  const crud = useCrudMutations({
    form,
    save: (body: KhoaRequest) => (editing ? updateKhoa(site, editing.maKhoa, body) : createKhoa(site, body)),
    remove: (maKhoa: string) => deleteKhoa(site, maKhoa),
    invalidate: [['khoa', site]],
    savedMessage: (saved) => (editing ? `Đã cập nhật ${saved.tenKhoa}` : `Đã thêm ${saved.tenKhoa} (${saved.maKhoa})`),
    onSaved: () => setOpen(false),
  })

  const openForm = (k: Khoa | null) => {
    setEditing(k)
    crud.setSaveError(null)
    form.resetFields()
    if (k) form.setFieldsValue({ maKhoa: k.maKhoa, tenKhoa: k.tenKhoa, moTa: k.moTa ?? undefined })
    setOpen(true)
  }

  const submit = (v: FormValues) =>
    crud.submit({ maKhoa: editing ? editing.maKhoa : blankToNull(v.maKhoa), tenKhoa: v.tenKhoa.trim(), moTa: blankToNull(v.moTa) })

  const columns: BaseColumns<Khoa> = [
    { title: 'Mã khoa', dataIndex: 'maKhoa', render: (v: string) => <code>{v}</code>, width: 130 },
    ...(hq ? [{ title: 'Chi nhánh', dataIndex: 'maCn', width: 110, render: (v: string | null) => <BaseTag>{tenCn(v)}</BaseTag> }] : []),
    {
      title: 'Tên khoa',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenKhoa}</BaseText>
          {r.moTa && <div className="muted">{r.moTa}</div>}
        </>
      ),
    },
    { title: 'Nhân viên', dataIndex: 'soNhanVien', align: 'right', width: 110 },
    { title: 'Lượt khám/chữa', dataIndex: 'soLuot', align: 'right', width: 140 },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, r) => {
        const used = r.soNhanVien > 0 || r.soLuot > 0
        return (
          <BaseSpace size={4}>
            <BaseEditButton onClick={() => openForm(r)} />
            <BaseDeleteButton
              title={`Xoá ${r.tenKhoa}?`}
              description={used ? 'Khoa còn nhân viên hoặc đã có lượt khám/chữa — không xoá được.' : 'Khoa chưa có dữ liệu → xoá hẳn.'}
              disabled={used}
              onConfirm={() => crud.removeById(r.maKhoa)}
            />
          </BaseSpace>
        )
      },
    },
  ]

  return (
    <>
      <PageTitle
        title="Khoa"
        description={
          hq
            ? 'Khoa phòng của cả chuỗi — view toàn cục KHOA ở S0 (postgres_fdw), chỉ xem.'
            : `Khoa phòng của ${branch?.tenCn ?? site} (KHOA). Mỗi khoa thuộc đúng 1 chi nhánh; tên khoa không trùng trong chi nhánh.`
        }
        extra={
          <BaseWritable>
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
              Thêm khoa
            </BaseButton>
          </BaseWritable>
        }
      />

      {listQuery.error && <BaseErrorAlert title="Không tải được danh sách khoa" error={listQuery.error} />}

      <BaseTable<Khoa>
        rowKey="maKhoa"
        unit="khoa"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 700 }}
      />

      <BaseFormModal<FormValues>
        open={open}
        title={editing ? `Sửa khoa · ${editing.maKhoa}` : 'Thêm khoa'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
      >
        <BaseFormItem
          label="Mã khoa"
          name="maKhoa"
          extra={editing ? undefined : `Để trống để tự sinh (${branch?.maCn ?? 'CN'}-K01…), hoặc nhập mã gợi nhớ như ${branch?.maCn ?? 'CN1'}-TMH`}
          rules={[{ pattern: /^[A-Za-z0-9-]*$/, message: 'Mã khoa chỉ gồm chữ, số và dấu gạch ngang' }]}
        >
          <BaseInput disabled={!!editing} maxLength={20} placeholder={`${branch?.maCn ?? 'CN1'}-…`} />
        </BaseFormItem>
        <BaseFormItem label="Tên khoa" name="tenKhoa" rules={[{ required: true, whitespace: true, message: 'Nhập tên khoa' }]}>
          <BaseInput maxLength={100} />
        </BaseFormItem>
        <BaseFormItem label="Mô tả" name="moTa">
          <BaseTextArea maxLength={2000} />
        </BaseFormItem>
      </BaseFormModal>
    </>
  )
}
