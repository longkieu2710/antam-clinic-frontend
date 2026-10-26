import { Form } from 'antd'

/** Tạo đối tượng điều khiển form (đặt giá trị, submit, báo lỗi từng ô) — dùng với BaseForm / BaseFormModal. */
export function useBaseForm<T>() {
  const [form] = Form.useForm<T>()
  return form
}

/**
 * Theo dõi giá trị một trường của form (render lại khi trường đổi) — vd tính tổng tiền khi nhập dịch vụ.
 * `useBaseWatch('dichVu', form)` hoặc `useBaseWatch(['dichVu', 0, 'soLuong'], form)`.
 */
export const useBaseWatch = Form.useWatch
