import { Button, Popconfirm } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { DeleteIcon, EditIcon } from '../icons'

/** Nút "Sửa" dạng link nhỏ — dùng trong cột thao tác của bảng. */
export function BaseEditButton({ children = 'Sửa', ...rest }: ButtonProps) {
  return (
    <Button type="link" size="small" icon={<EditIcon />} {...rest}>
      {children}
    </Button>
  )
}

interface BaseDeleteButtonProps {
  /** Câu hỏi xác nhận, vd "Xoá Paracetamol?" */
  title: ReactNode
  /** Giải thích hậu quả của thao tác xoá */
  description?: ReactNode
  /** Chữ trên nút đồng ý (mặc định "Xoá") */
  okText?: string
  /** Nút đồng ý màu đỏ (mặc định true) */
  danger?: boolean
  /** Trả về Promise thì nút đồng ý hiện trạng thái đang xử lý tới khi xong */
  onConfirm: () => unknown
  disabled?: boolean
  children?: ReactNode
}

/** Nút "Xoá" dạng link đỏ, bấm vào hiện hộp xác nhận trước khi xoá. */
export function BaseDeleteButton({
  title,
  description,
  okText = 'Xoá',
  danger = true,
  onConfirm,
  disabled,
  children = 'Xoá',
}: BaseDeleteButtonProps) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText={okText}
      okButtonProps={{ danger }}
      cancelText="Huỷ"
      onConfirm={onConfirm}
      disabled={disabled}
    >
      <Button type="link" size="small" danger icon={<DeleteIcon />} disabled={disabled}>
        {children}
      </Button>
    </Popconfirm>
  )
}
