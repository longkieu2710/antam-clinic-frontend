import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'

/** Ô nhập số — mặc định rộng hết cột. */
export function BaseNumberInput({ style, ...rest }: InputNumberProps<number>) {
  return <InputNumber<number> style={{ width: '100%', ...style }} {...rest} />
}

const formatMoney = (value?: number | string) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseMoney = (text?: string) => Number((text ?? '').replace(/\./g, ''))

/** Ô nhập tiền VNĐ: hiển thị dấu chấm ngăn cách hàng nghìn (25.000), không âm, bước 500. */
export function BaseMoneyInput(props: InputNumberProps<number>) {
  return <BaseNumberInput min={0} step={500} formatter={formatMoney} parser={parseMoney} {...props} />
}
