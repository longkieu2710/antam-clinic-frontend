import dayjs from 'dayjs'

export const money = (value: number | null | undefined) =>
  value == null ? '—' : `${Math.round(value).toLocaleString('vi-VN')} ₫`

export const dateVN = (iso: string | null | undefined) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '—')

export const dateTimeVN = (iso: string | null | undefined) => (iso ? dayjs(iso).format('DD/MM/YYYY HH:mm') : '—')

/** '2026-09' → '09/2026' */
export const monthVN = (yyyyMM: string) => `${yyyyMM.slice(5, 7)}/${yyyyMM.slice(0, 4)}`

export const age = (iso: string | null | undefined) => (iso ? dayjs().diff(dayjs(iso), 'year') : null)

/** '' / khoảng trắng → null, để backend không ghi chuỗi rỗng vào cột UNIQUE. */
export const blankToNull = (value: string | null | undefined) =>
  value == null || value.trim() === '' ? null : value.trim()
