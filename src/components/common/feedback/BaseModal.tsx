import { Modal } from 'antd'
import type { ModalProps } from 'antd'

/** Hộp thoại — mặc định nút "Lưu" / "Huỷ", đóng lại thì huỷ nội dung bên trong. */
export function BaseModal({ okText = 'Lưu', cancelText = 'Huỷ', destroyOnHidden = true, ...rest }: ModalProps) {
  return <Modal okText={okText} cancelText={cancelText} destroyOnHidden={destroyOnHidden} {...rest} />
}
