import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createBenh, deleteBenh, getBenhMaster, updateBenh } from '../api/endpoints'
import type { Benh, BenhRequest } from '../api/types'
import {
  AddIcon,
  BaseButton,
  BaseCol,
  BaseDeleteButton,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseRow,
  BaseSearchInput,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  BaseTextArea,
  BaseTooltip,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import { PageTitle } from '../layout/PageTitle'
import { blankToNull } from '../utils/format'

/**
 * Bệnh (ICD-10) — danh mục chung: đọc/ghi tại S0, Logical Replication đẩy xuống S1..S3.
 * Cột "Đã chẩn đoán" đọc view CHAN_DOAN_DIEU_TRI toàn cục ở S0 (postgres_fdw gộp 3 chi nhánh).
 */
export function BenhPage() {
  const form = useBaseForm<BenhRequest>()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Benh | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({ queryKey: ['benh-master', q], queryFn: () => getBenhMaster(q) })

  const crud = useCrudMutations({
    form,
    save: (body: BenhRequest) => (editing ? updateBenh(editing.maBenh, body) : createBenh(body)),
    remove: deleteBenh,
    invalidate: [['benh-master']],
    savedMessage: (saved) => `Đã lưu ${saved.maBenh} tại S0 — đang đồng bộ xuống 3 chi nhánh`,
    onSaved: () => setOpen(false),
  })

  const openForm = (b: Benh | null) => {
    setEditing(b)
    crud.setSaveError(null)
    form.resetFields()
    if (b) form.setFieldsValue({ ...b, maICD10: b.maICD10 ?? undefined, moTa: b.moTa ?? undefined })
    setOpen(true)
  }

  const submit = (v: BenhRequest) =>
    crud.submit({
      maBenh: editing ? editing.maBenh : blankToNull(v.maBenh),
      tenBenh: v.tenBenh.trim(),
      maICD10: blankToNull(v.maICD10),
      moTa: blankToNull(v.moTa),
    })

  const columns: BaseColumns<Benh> = [
    { title: 'Mã', dataIndex: 'maBenh', render: (v: string) => <code>{v}</code>, width: 90 },
    { title: 'ICD-10', dataIndex: 'maICD10', render: (v: string | null) => (v ? <BaseTag>{v}</BaseTag> : '—'), width: 100 },
    {
      title: 'Bệnh',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBenh}</BaseText>
          {r.moTa && <div className="muted">{r.moTa}</div>}
        </>
      ),
    },
    {
      title: 'Đã chẩn đoán (toàn chuỗi)',
      dataIndex: 'soLanChanDoan',
      align: 'right',
      width: 200,
      render: (v: number | null) =>
        v == null ? (
          <BaseTooltip title="Không đọc được view CHAN_DOAN_DIEU_TRI tại S0 (một chi nhánh đang tắt)">
            <BaseTag>?</BaseTag>
          </BaseTooltip>
        ) : (
          `${v} đợt`
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
            title={`Xoá ${r.tenBenh}?`}
            description="Backend kiểm tra bệnh đã được chẩn đoán ở chi nhánh nào chưa (view CHAN_DOAN_DIEU_TRI tại S0) rồi mới xoá."
            disabled={(r.soLanChanDoan ?? 0) > 0}
            onConfirm={() => crud.removeById(r.maBenh)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Bệnh (ICD-10)"
        hub
        description="Danh mục bệnh dùng chung toàn chuỗi. Ghi tại S0, Logical Replication tự đẩy xuống S1, S2, S3."
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
            Thêm bệnh
          </BaseButton>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên bệnh, mã ICD-10…" onSearch={setQ} />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh mục bệnh từ S0" error={listQuery.error} />}

      <BaseTable<Benh>
        rowKey="maBenh"
        unit="bệnh"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 800 }}
      />

      <BaseFormModal<BenhRequest>
        open={open}
        title={editing ? `Sửa bệnh · ${editing.maBenh}` : 'Thêm bệnh'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
      >
        <BaseRow>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Mã bệnh" name="maBenh" extra={editing ? undefined : 'Để trống để tự sinh'}>
              <BaseInput disabled={!!editing} maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Mã ICD-10" name="maICD10" extra="Không trùng trong danh mục (UNIQUE)">
              <BaseInput maxLength={20} placeholder="VD: J02" />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24}>
            <BaseFormItem label="Tên bệnh" name="tenBenh" rules={[{ required: true, whitespace: true, message: 'Nhập tên bệnh' }]}>
              <BaseInput maxLength={150} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24}>
            <BaseFormItem label="Mô tả" name="moTa">
              <BaseTextArea maxLength={2000} />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
      </BaseFormModal>
    </>
  )
}
