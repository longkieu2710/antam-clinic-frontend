import { App } from 'antd'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

/**
 * Thông báo ngắn (toast) ở đầu màn hình.
 * Thời gian hiển thị mặc định: thành công / thông tin 3 giây, cảnh báo / lỗi 6 giây.
 */
export function useNotify() {
  const { message } = App.useApp()
  return useMemo(
    () => ({
      success: (content: ReactNode, seconds = 3) => {
        void message.success(content, seconds)
      },
      info: (content: ReactNode, seconds = 3) => {
        void message.info(content, seconds)
      },
      warning: (content: ReactNode, seconds = 6) => {
        void message.warning(content, seconds)
      },
      error: (content: ReactNode, seconds = 6) => {
        void message.error(content, seconds)
      },
    }),
    [message],
  )
}
