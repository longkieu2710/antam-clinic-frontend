import type { CSSProperties, ReactNode } from 'react'
import { ApiError, errorText } from '../../../api/http'
import { BaseAlert } from './BaseAlert'

interface BaseErrorAlertProps {
  /** Lỗi bắt được khi gọi API (ApiError hoặc Error bất kỳ) */
  error: unknown
  /** Tiêu đề; bỏ trống thì dùng thông báo lỗi của backend làm tiêu đề */
  title?: ReactNode
  style?: CSSProperties
}

/** Hiển thị lỗi gọi API: thông báo tiếng Việt của backend + DETAIL / SQLSTATE của PostgreSQL nếu có. */
export function BaseErrorAlert({ error, title, style }: BaseErrorAlertProps) {
  if (error instanceof ApiError) {
    const extra = [error.detail, error.sqlState && `SQLSTATE ${error.sqlState}`].filter(Boolean)
    const description = (title ? [error.message, ...extra] : extra).join(' · ')
    return <BaseAlert type="error" style={style} title={title ?? error.message} description={description || undefined} />
  }
  return <BaseAlert type="error" style={style} title={title ?? 'Có lỗi xảy ra'} description={errorText(error)} />
}
