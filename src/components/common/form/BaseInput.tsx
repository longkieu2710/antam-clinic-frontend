import { Input } from 'antd'
import type { InputProps } from 'antd'
import type { ComponentProps } from 'react'

type SearchProps = ComponentProps<typeof Input.Search>

/** Ô nhập chữ. */
export function BaseInput(props: InputProps) {
  return <Input {...props} />
}

/** Ô tìm kiếm có nút kính lúp (Enter để tìm) — mặc định có nút xoá, rộng tối đa 340px. */
export function BaseSearchInput({ allowClear = true, style, ...rest }: SearchProps) {
  return <Input.Search allowClear={allowClear} style={{ maxWidth: 340, ...style }} {...rest} />
}
