import { Result } from 'antd'
import type { ResultProps } from 'antd'

/** Trang kết quả / trạng thái lớn (404, đang phát triển…). */
export function BaseResult(props: ResultProps) {
  return <Result {...props} />
}
