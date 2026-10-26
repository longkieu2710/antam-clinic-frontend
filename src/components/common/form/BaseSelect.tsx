import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { ReactNode } from 'react'

export interface BaseOption {
  value: string
  label: ReactNode
}

export interface BaseSelectProps extends Omit<SelectProps<string>, 'options'> {
  /** Lựa chọn: mảng chuỗi (giá trị = nhãn) hoặc mảng { value, label } */
  options?: readonly (string | BaseOption)[]
}

const toOptions = (options?: readonly (string | BaseOption)[]) =>
  options?.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))

/** Ô chọn một giá trị. */
export function BaseSelect({ options, ...rest }: BaseSelectProps) {
  return <Select<string> options={toOptions(options)} {...rest} />
}

/** Ô nhập nhiều giá trị tự do (gõ rồi Enter / dấu phẩy / dấu cách) — vd danh sách số điện thoại. */
export function BaseTagsInput(props: Omit<SelectProps<string[]>, 'mode' | 'options'>) {
  return <Select<string[]> mode="tags" tokenSeparators={[',', ' ']} open={false} {...props} />
}
