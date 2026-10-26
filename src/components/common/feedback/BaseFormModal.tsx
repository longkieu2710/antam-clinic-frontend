import type { ReactNode } from 'react'
import { BaseForm } from '../form/BaseForm'
import type { BaseFormInstance } from '../form/BaseForm'
import { BaseErrorAlert } from './BaseErrorAlert'
import { BaseModal } from './BaseModal'

interface BaseFormModalProps<T> {
  open: boolean
  title: ReactNode
  /** Tạo bằng useBaseForm<T>() */
  form: BaseFormInstance<T>
  /** Chạy khi bấm nút đồng ý và mọi ô đã hợp lệ */
  onSubmit: (values: T) => void
  onCancel: () => void
  okText?: string
  width?: number
  /** Đang gửi lên server → nút đồng ý hiện vòng xoay */
  loading?: boolean
  /** Lỗi backend trả về khi lưu (hiện ở đầu form); null = không có lỗi */
  error?: unknown
  /** Ghi chú hiển thị phía trên form (quy tắc nghiệp vụ…) */
  notice?: ReactNode
  /** Các BaseFormItem */
  children: ReactNode
}

/** Hộp thoại chứa form thêm / sửa: nút đồng ý = submit form, hiện lỗi backend ở đầu form. */
export function BaseFormModal<T>({
  open,
  title,
  form,
  onSubmit,
  onCancel,
  okText,
  width,
  loading,
  error,
  notice,
  children,
}: BaseFormModalProps<T>) {
  return (
    <BaseModal open={open} title={title} width={width} okText={okText} confirmLoading={loading} onOk={() => form.submit()} onCancel={onCancel}>
      {error != null && <BaseErrorAlert error={error} />}
      {notice}
      <BaseForm<T> form={form} onFinish={onSubmit}>
        {children}
      </BaseForm>
    </BaseModal>
  )
}
