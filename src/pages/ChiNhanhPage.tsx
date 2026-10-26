import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateChiNhanh } from '../api/endpoints'
import { errorText } from '../api/http'
import {
  BaseAlert,
  BaseEditButton,
  BaseErrorAlert,
  BaseFormItem,
  BaseFormModal,
  BaseInput,
  BaseTable,
  BaseTag,
  useBaseForm,
  useNotify,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import type { ChiNhanh } from '../api/types'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { blankToNull } from '../utils/format'

interface FormValues {
  tenCn: string
  diaChi?: string
  soDienThoai?: string
}

/** Chi nhánh — ghi tại S0. Chỉ sửa thông tin; không thêm / xoá / đổi mã (xem requirements/tech-stack.md). */
export function ChiNhanhPage() {
  const { branches, loading, error } = useSite()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const form = useBaseForm<FormValues>()
  const [editing, setEditing] = useState<ChiNhanh | null>(null)

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      updateChiNhanh(editing!.maCn, { tenCn: v.tenCn.trim(), diaChi: blankToNull(v.diaChi), soDienThoai: blankToNull(v.soDienThoai) }),
    onSuccess: () => {
      notify.success('Đã lưu tại S0 — đang đồng bộ xuống 3 chi nhánh')
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['chi-nhanh'] })
    },
    onError: (e) => notify.error(errorText(e)),
  })

  const columns: BaseColumns<ChiNhanh> = [
    { title: 'Mã', dataIndex: 'maCn', render: (v: string) => <code>{v}</code>, width: 80 },
    {
      title: 'Tên chi nhánh',
      dataIndex: 'tenCn',
      render: (v: string, r) => (
        <>
          <strong>{v}</strong> {!r.inDatabase && <BaseTag color="warning">không đọc được S0</BaseTag>}
        </>
      ),
    },
    { title: 'Địa chỉ', dataIndex: 'diaChi', render: (v: string | null) => v ?? '—' },
    { title: 'Điện thoại', dataIndex: 'soDienThoai', render: (v: string | null) => (v ? <code>{v}</code> : '—') },
    {
      title: 'Trạm (application.yml)',
      render: (_, r) => (
        <code>
          {r.site} · {r.jdbcUrl.replace('jdbc:postgresql://', '')}
        </code>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <BaseEditButton
          disabled={!r.inDatabase}
          onClick={() => {
            setEditing(r)
            form.setFieldsValue({ tenCn: r.tenCn, diaChi: r.diaChi ?? undefined, soDienThoai: r.soDienThoai ?? undefined })
          }}
        />
      ),
    },
  ]

  return (
    <>
      <PageTitle title="Chi nhánh" hub description="Thông tin chi nhánh lưu ở S0. Dropdown 'Chi nhánh đang làm việc' trên thanh tiêu đề lấy từ danh sách này." />
      <BaseAlert
        type="warning"
        title="Không có Thêm / Xoá / đổi mã chi nhánh"
        description="FDW server và các view toàn cục ở S0 đang cố định 3 chi nhánh; chi nhánh nhận dữ liệu đồng bộ không kiểm tra khoá ngoại nên xoá hoặc đổi mã sẽ để lại dữ liệu mồ côi."
      />
      {error != null && <BaseErrorAlert title="Không tải được chi nhánh" error={error} />}
      <BaseTable<ChiNhanh> rowKey="site" columns={columns} dataSource={branches} loading={loading} pagination={false} scroll={{ x: 900 }} />

      <BaseFormModal<FormValues>
        open={editing != null}
        title={`Sửa chi nhánh · ${editing?.maCn ?? ''}`}
        form={form}
        onSubmit={(v) => mutation.mutate(v)}
        onCancel={() => setEditing(null)}
        loading={mutation.isPending}
      >
        <BaseFormItem label="Tên chi nhánh" name="tenCn" rules={[{ required: true, whitespace: true, message: 'Nhập tên chi nhánh' }]}>
          <BaseInput maxLength={100} />
        </BaseFormItem>
        <BaseFormItem label="Địa chỉ" name="diaChi">
          <BaseInput maxLength={255} />
        </BaseFormItem>
        <BaseFormItem label="Số điện thoại" name="soDienThoai">
          <BaseInput maxLength={20} />
        </BaseFormItem>
      </BaseFormModal>
    </>
  )
}
