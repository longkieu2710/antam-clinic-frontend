import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import dayjs from 'dayjs'

type BaseDatePickerProps = DatePickerProps & {
  /** Không cho chọn ngày sau hôm nay (ngày sinh…) */
  disableFuture?: boolean
}

/** Ô chọn ngày — mặc định hiển thị DD/MM/YYYY, rộng hết cột. Giá trị là đối tượng dayjs. */
export function BaseDatePicker({ format = 'DD/MM/YYYY', style, disableFuture, disabledDate, ...rest }: BaseDatePickerProps) {
  return (
    <DatePicker
      format={format}
      style={{ width: '100%', ...style }}
      disabledDate={disableFuture ? (d, info) => d.isAfter(dayjs(), 'day') || (disabledDate?.(d, info) ?? false) : disabledDate}
      {...rest}
    />
  )
}
