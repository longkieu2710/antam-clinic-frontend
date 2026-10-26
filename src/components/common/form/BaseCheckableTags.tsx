import { Flex, Tag } from 'antd'
import type { ReactNode } from 'react'

export interface BaseCheckableOption {
  value: string
  label: ReactNode
  /** chữ phụ màu nhạt sau nhãn */
  extra?: ReactNode
  disabled?: boolean
}

interface BaseCheckableTagsProps {
  options: BaseCheckableOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  /** chỉ hiển thị, không cho bấm */
  disabled?: boolean
}

/**
 * Nhóm nhãn bấm để chọn nhiều giá trị (y tá hỗ trợ, hình thức chữa…). Dùng được trong BaseFormItem
 * (nhận value / onChange như ô nhập).
 */
export function BaseCheckableTags({ options, value = [], onChange, disabled }: BaseCheckableTagsProps) {
  const toggle = (v: string, checked: boolean) =>
    onChange?.(checked ? [...value, v] : value.filter((x) => x !== v))
  return (
    <Flex wrap gap={8}>
      {options.map((o) => (
        <Tag.CheckableTag
          key={o.value}
          checked={value.includes(o.value)}
          onChange={(checked) => !disabled && !o.disabled && toggle(o.value, checked)}
          className="base-checkable-tag"
          aria-disabled={disabled || o.disabled}
        >
          {o.label}
          {o.extra && <span className="base-checkable-extra"> {o.extra}</span>}
        </Tag.CheckableTag>
      ))}
    </Flex>
  )
}
