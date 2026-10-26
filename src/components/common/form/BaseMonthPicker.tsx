import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import type { Dayjs } from 'dayjs'

type BaseMonthPickerProps = Omit<DatePickerProps, 'value' | 'defaultValue' | 'onChange' | 'onOk' | 'picker' | 'multiple'> & {
  /** tháng đang chọn (dayjs bất kỳ ngày nào trong tháng) */
  value: Dayjs
  /** nhận ngày đầu tháng được chọn */
  onChange: (month: Dayjs) => void
}

/** Ô chọn tháng — hiển thị MM/YYYY, luôn có giá trị (không cho xoá trống). */
export function BaseMonthPicker({ value, onChange, format = 'MM/YYYY', ...rest }: BaseMonthPickerProps) {
  return (
    <DatePicker
      picker="month"
      format={format}
      allowClear={false}
      value={value}
      onChange={(d) => {
        if (d && !Array.isArray(d)) onChange(d.startOf('month'))
      }}
      {...rest}
    />
  )
}
