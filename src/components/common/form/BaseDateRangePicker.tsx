import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import type { ComponentProps } from 'react'

type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>

type BaseDateRangePickerProps = Omit<RangePickerProps, 'value' | 'defaultValue' | 'onChange'> & {
  /** [từ ngày, đến ngày] */
  value: [Dayjs, Dayjs]
  /** chỉ gọi khi đã chọn đủ cả hai ngày */
  onChange: (range: [Dayjs, Dayjs]) => void
}

/** Ô chọn khoảng ngày (từ ngày – đến ngày) — hiển thị DD/MM/YYYY, luôn có đủ hai đầu. */
export function BaseDateRangePicker({ value, onChange, format = 'DD/MM/YYYY', ...rest }: BaseDateRangePickerProps) {
  return (
    <DatePicker.RangePicker
      format={format}
      allowClear={false}
      value={value}
      onChange={(dates) => {
        if (dates?.[0] && dates[1]) onChange([dates[0], dates[1]])
      }}
      {...rest}
    />
  )
}
