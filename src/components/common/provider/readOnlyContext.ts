import { createContext, useContext } from 'react'

/** true: phần giao diện đang ở chế độ chỉ xem (bản Trung tâm xem dữ liệu chi nhánh). */
export const ReadOnlyContext = createContext(false)

/** Trang đang ở chế độ chỉ xem — ẩn các thao tác thêm / sửa / xoá. */
export function useBaseReadOnly(): boolean {
  return useContext(ReadOnlyContext)
}
