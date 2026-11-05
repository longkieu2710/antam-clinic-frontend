import dayjs from 'dayjs'

export const money = (value: number | null | undefined) =>
  value == null ? '—' : `${Math.round(value).toLocaleString('vi-VN')} ₫`

export const dateVN = (iso: string | null | undefined) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '—')

export const dateTimeVN = (iso: string | null | undefined) => (iso ? dayjs(iso).format('DD/MM/YYYY HH:mm:ss') : '—')

/** '2026-09' → '09/2026' */
export const monthVN = (yyyyMM: string) => `${yyyyMM.slice(5, 7)}/${yyyyMM.slice(0, 4)}`

export const age = (iso: string | null | undefined) => (iso ? dayjs().diff(dayjs(iso), 'year') : null)

/** '' / khoảng trắng → null, để backend không ghi chuỗi rỗng vào cột UNIQUE. */
export const blankToNull = (value: string | null | undefined) =>
  value == null || value.trim() === '' ? null : value.trim()

/** Gom các dòng tra mã toàn chuỗi theo mã bệnh nhân: [[maBN, [maCn…]]] — một người có thể có hồ sơ ở nhiều chi nhánh */
export const gomTheoMa = (rows: { maBN: string; maCn: string }[]): [string, string[]][] =>
  Object.entries(rows.reduce<Record<string, string[]>>((m, x) => ({ ...m, [x.maBN]: [...(m[x.maBN] ?? []), x.maCn] }), {}))
