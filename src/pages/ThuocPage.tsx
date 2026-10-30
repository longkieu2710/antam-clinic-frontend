import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createThuoc, deleteThuoc, getThuocMaster, getThuocReplica, updateThuoc } from '../api/endpoints'
import { errorText } from '../api/http'
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
  SyncIcon,
  useBaseForm,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { useCrudMutations } from '../hooks/useCrudMutations'
import type { Thuoc, ThuocRequest } from '../api/types'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { blankToNull, money } from '../utils/format'

const DON_VI = ['Viên', 'Gói', 'Chai', 'Ống', 'Tuýp', 'Hộp', 'ml']

/**
 * Thuốc — danh mục chung: đọc/ghi tại S0, Logical Replication đẩy xuống S1..S3.
 * Ô "Bản sao tại chi nhánh" đọc /api/thuoc với X-Site để thấy đồng bộ đã chạy.
 */
export function ThuocPage() {
  const { mode, site, branch } = useSite()
  const queryClient = useQueryClient()
  const form = useBaseForm<ThuocRequest>()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Thuoc | null>(null)
  const [open, setOpen] = useState(false)

  const listQuery = useQuery({ queryKey: ['thuoc-master', q], queryFn: () => getThuocMaster(q) })
  // Bản Trung tâm không đọc dữ liệu chi nhánh → không so với bản sao
  const replicaQuery = useQuery({ queryKey: ['thuoc-replica', site], queryFn: () => getThuocReplica(site), enabled: mode !== 'HQ' })

  /** Bản sao ở chi nhánh được làm mới sau 1,5 giây (chờ Logical Replication). */
  const refreshReplicaLater = () =>
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['thuoc-replica'] }), 1500)

  const crud = useCrudMutations({
    form,
    save: (body: ThuocRequest) => (editing ? updateThuoc(editing.maThuoc, body) : createThuoc(body)),
    remove: deleteThuoc,
    invalidate: [['thuoc-master']],
    savedMessage: (saved) => `Đã lưu ${saved.maThuoc} tại S0 — đang đồng bộ xuống 3 chi nhánh`,
    onSaved: () => {
      setOpen(false)
      refreshReplicaLater()
    },
    onDeleted: refreshReplicaLater,
  })

  const openForm = (t: Thuoc | null) => {
    setEditing(t)
    crud.setSaveError(null)
    form.resetFields()
    form.setFieldsValue(t ? { ...t, hoatChat: t.hoatChat ?? undefined, hangSX: t.hangSX ?? undefined } : { donViTinh: 'Viên', donGia: 0 })
    setOpen(true)
  }

  const submit = (v: ThuocRequest) =>
    crud.submit({
      maThuoc: editing ? editing.maThuoc : blankToNull(v.maThuoc),
      tenThuoc: v.tenThuoc.trim(),
      hoatChat: blankToNull(v.hoatChat),
      donViTinh: v.donViTinh,
      donGia: v.donGia,
      hangSX: blankToNull(v.hangSX),
    })

  const masterCount = listQuery.data?.length
  const replicaCount = replicaQuery.data?.length
  const inSync = q === '' && masterCount != null && replicaCount != null && masterCount === replicaCount

  const columns: BaseColumns<Thuoc> = [
    { title: 'Mã', dataIndex: 'maThuoc', render: (v: string) => <code>{v}</code>, width: 90 },
    {
      title: 'Thuốc',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenThuoc}</BaseText>
          {r.hoatChat && <div className="muted">{r.hoatChat}</div>}
        </>
      ),
    },
    { title: 'ĐVT', dataIndex: 'donViTinh', width: 80 },
    { title: 'Đơn giá', dataIndex: 'donGia', align: 'right', render: money, width: 130 },
    { title: 'Hãng sản xuất', dataIndex: 'hangSX', render: (v: string | null) => v ?? '—' },
    {
      title: 'Đã kê (toàn chuỗi)',
      dataIndex: 'soLanKe',
      align: 'right',
      width: 150,
      render: (v: number | null) =>
        v == null ? (
          <BaseTooltip title="Không đọc được view KE_DON tại S0 (một chi nhánh đang tắt)">
            <BaseTag>?</BaseTag>
          </BaseTooltip>
        ) : (
          `${v} đơn`
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
            title={`Xoá ${r.tenThuoc}?`}
            description="Backend kiểm tra thuốc đã được kê ở chi nhánh nào chưa (view KE_DON tại S0) rồi mới xoá."
            onConfirm={() => crud.removeById(r.maThuoc)}
          />
        </BaseSpace>
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Thuốc"
        hub
        description="Danh mục dùng chung toàn chuỗi. Ghi tại S0, Logical Replication (pub_master_catalogs) tự đẩy xuống S1, S2, S3."
        extra={
          <BaseButton type="primary" icon={<AddIcon />} onClick={() => openForm(null)}>
            Thêm thuốc
          </BaseButton>
        }
      />

      {mode !== 'HQ' && (
        <BaseAlert
          type={replicaQuery.error ? 'warning' : inSync ? 'success' : 'info'}
          title={`Bản sao tại ${branch?.tenCn ?? site} (${site})`}
          description={
            replicaQuery.error
              ? errorText(replicaQuery.error)
              : q !== ''
                ? `${site} có ${replicaCount ?? '…'} thuốc (bỏ ô tìm kiếm để so với S0)`
                : `S0 có ${masterCount ?? '…'} thuốc · ${site} có ${replicaCount ?? '…'} thuốc` +
                  (inSync ? ' — đã đồng bộ' : replicaCount != null && masterCount != null ? ' — đang lệch, replication có thể trễ vài giây' : '')
          }
          action={
            <BaseButton size="small" icon={<SyncIcon />} loading={replicaQuery.isFetching} onClick={() => replicaQuery.refetch()}>
              Kiểm tra lại
            </BaseButton>
          }
        />
      )}

      <div className="toolbar">
        <BaseSearchInput placeholder="Tìm mã, tên, hoạt chất…" onSearch={setQ} />
      </div>

      {listQuery.error && <BaseErrorAlert title="Không tải được danh mục thuốc từ S0" error={listQuery.error} />}

      <BaseTable<Thuoc>
        rowKey="maThuoc"
        unit="thuốc"
        columns={columns}
        dataSource={listQuery.data ?? []}
        loading={listQuery.isLoading || crud.deleteMutation.isPending}
        scroll={{ x: 860 }}
      />

      <BaseFormModal<ThuocRequest>
        open={open}
        title={editing ? `Sửa thuốc · ${editing.maThuoc}` : 'Thêm thuốc'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        form={form}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        loading={crud.saveMutation.isPending}
        error={crud.saveError}
        notice={
          editing && (
            <BaseAlert type="info" title="Đổi đơn giá không ảnh hưởng đơn đã kê" description="KE_DON lưu DonGiaApDung tại thời điểm kê (BR7)." />
          )
        }
      >
        <BaseRow>
          <BaseCol xs={24} md={8}>
            <BaseFormItem label="Mã thuốc" name="maThuoc" extra={editing ? undefined : 'Để trống để tự sinh'}>
              <BaseInput disabled={!!editing} maxLength={20} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={16}>
            <BaseFormItem label="Tên thuốc" name="tenThuoc" rules={[{ required: true, whitespace: true, message: 'Nhập tên thuốc' }]}>
              <BaseInput maxLength={150} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Hoạt chất" name="hoatChat">
              <BaseInput maxLength={150} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Hãng sản xuất" name="hangSX">
              <BaseInput maxLength={100} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Đơn vị tính" name="donViTinh" rules={[{ required: true, message: 'Chọn đơn vị tính' }]}>
              <BaseSelect options={DON_VI} />
            </BaseFormItem>
          </BaseCol>
          <BaseCol xs={24} md={12}>
            <BaseFormItem label="Đơn giá (₫)" name="donGia" rules={[{ required: true, message: 'Nhập đơn giá' }]}>
              <BaseMoneyInput />
            </BaseFormItem>
          </BaseCol>
        </BaseRow>
      </BaseFormModal>
    </>
  )
}
