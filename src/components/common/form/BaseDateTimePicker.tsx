import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import dayjs from 'dayjs'

type BaseDateTimePickerProps = DatePickerProps & {
  /** Không cho chọn thời điểm sau hiện tại (thời gian khám / chữa) */
  disableFuture?: boolean
}

/** Ô chọn ngày + giờ — hiển thị DD/MM/YYYY HH:mm, bước 5 phút, rộng hết cột. Giá trị là đối tượng dayjs. */
export function BaseDateTimePicker({
  format = 'DD/MM/YYYY HH:mm',
  style,
  disableFuture,
  disabledDate,
  ...rest
}: BaseDateTimePickerProps) {
  return (
    <DatePicker
      showTime={{ format: 'HH:mm', minuteStep: 5 }}
      format={format}
      style={{ width: '100%', ...style }}
      disabledDate={disableFuture ? (d, info) => d.isAfter(dayjs(), 'day') || (disabledDate?.(d, info) ?? false) : disabledDate}
      {...rest}
    />
  )
}
