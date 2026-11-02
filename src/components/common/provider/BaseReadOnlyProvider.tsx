import type { ReactNode } from 'react'
import { ReadOnlyContext } from './readOnlyContext'

/**
 * Bọc phần trang ở chế độ chỉ xem: BaseEditButton, BaseDeleteButton và BaseWritable bên trong tự ẩn.
 * Backend vẫn chặn ghi (403 READ_ONLY) — đây chỉ là phần giao diện.
 */
export function BaseReadOnlyProvider({ readOnly, children }: { readOnly: boolean; children: ReactNode }) {
  return <ReadOnlyContext.Provider value={readOnly}>{children}</ReadOnlyContext.Provider>
}
