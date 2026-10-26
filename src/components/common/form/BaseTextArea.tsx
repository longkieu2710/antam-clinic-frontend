import { Input } from 'antd'
import type { ComponentProps } from 'react'

type TextAreaProps = ComponentProps<typeof Input.TextArea>

/** Ô nhập nhiều dòng — mặc định tự giãn chiều cao từ 2 đến 5 dòng. */
export function BaseTextArea({ autoSize = { minRows: 2, maxRows: 5 }, ...rest }: TextAreaProps) {
  return <Input.TextArea autoSize={autoSize} {...rest} />
}
