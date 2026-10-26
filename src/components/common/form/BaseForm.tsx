import { Form } from 'antd'
import type { FormInstance, FormItemProps, FormProps } from 'antd'
import type { ReactNode } from 'react'

export type BaseFormInstance<T> = FormInstance<T>

type BaseFormProps<T> = Omit<FormProps<T>, 'children'> & {
  children?: ReactNode
  /**
   * false: nhấn Enter trong ô nhập KHÔNG gửi form (form dài như lượt khám / chữa — tránh lưu nhầm khi đang gõ hay chọn
   * ngày). Mặc định true như form HTML thường.
   */
  submitOnEnter?: boolean
}

/** Form chung — mặc định nhãn nằm trên ô nhập. Tạo `form` bằng useBaseForm(). */
export function BaseForm<T>({ layout = 'vertical', submitOnEnter = true, onKeyDown, ...rest }: BaseFormProps<T>) {
  return (
    <Form<T>
      layout={layout}
      onKeyDown={(e) => {
        if (!submitOnEnter && e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault()
        onKeyDown?.(e)
      }}
      {...rest}
    />
  )
}

/**
 * Danh sách dòng động trong form (chẩn đoán, dịch vụ, thuốc…): `name` là tên mảng, children nhận
 * (fields, { add, remove }). Ô bên trong đặt `name={[field.name, 'maDV']}`.
 */
export const BaseFormList = Form.List

/** Một ô trong form: nhãn + ô nhập + kiểm tra hợp lệ (rules). `name` trùng tên trường của dữ liệu. */
export function BaseFormItem(props: FormItemProps) {
  return <Form.Item {...props} />
}
