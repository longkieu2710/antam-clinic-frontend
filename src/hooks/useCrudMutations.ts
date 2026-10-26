import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError, errorText } from '../api/http'
import type { DeleteResult } from '../api/types'
import { useNotify } from '../components/common'
import type { BaseFormInstance } from '../components/common'

interface Options<TBody, TSaved, TValues> {
  /** form đang mở — lỗi từng trường do backend trả về (fieldErrors) được gắn vào các ô tương ứng */
  form: BaseFormInstance<TValues>
  /** gọi API thêm hoặc sửa (tuỳ đang sửa hay thêm mới) */
  save: (body: TBody) => Promise<TSaved>
  /** gọi API xoá theo mã */
  remove: (id: string) => Promise<DeleteResult>
  /** các query cần tải lại sau khi lưu / xoá thành công */
  invalidate: QueryKey[]
  /** thông báo khi lưu thành công */
  savedMessage: (saved: TSaved) => string
  /** chạy sau khi lưu thành công (vd đóng hộp thoại) */
  onSaved?: (saved: TSaved) => void
  /** chạy sau khi xoá thành công */
  onDeleted?: (result: DeleteResult) => void
}

/**
 * Hai thao tác ghi dùng chung cho các màn danh mục:
 * - lưu: lỗi backend hiện ở đầu form (saveError) và gắn vào từng ô nếu có fieldErrors;
 * - xoá: HARD → thông báo thành công, SOFT (BR9: chỉ chuyển trạng thái) → thông báo cảnh báo.
 */
export function useCrudMutations<TBody, TSaved, TValues>(options: Options<TBody, TSaved, TValues>) {
  const { form, save, remove, invalidate, savedMessage, onSaved, onDeleted } = options
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<ApiError | null>(null)

  const refresh = () => invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))

  const saveMutation = useMutation({
    mutationFn: save,
    onSuccess: (saved) => {
      notify.success(savedMessage(saved))
      onSaved?.(saved)
      refresh()
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setSaveError(error)
        if (error.fieldErrors) {
          form.setFields(
            Object.entries(error.fieldErrors).map(([name, msg]) => ({ name: name as never, errors: [msg] })),
          )
        }
      } else {
        notify.error(errorText(error))
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: (result) => {
      if (result.mode === 'SOFT') notify.warning(result.message)
      else notify.success(result.message)
      onDeleted?.(result)
      refresh()
    },
    onError: (error) => notify.error(errorText(error)),
  })

  /** Gửi lưu — xoá lỗi lần trước trước khi gửi. */
  const submit = (body: TBody) => {
    setSaveError(null)
    saveMutation.mutate(body)
  }

  /** Xoá — trả Promise để nút xác nhận hiện trạng thái đang xử lý; lỗi đã được thông báo nên nuốt ở đây. */
  const removeById = (id: string) => deleteMutation.mutateAsync(id).catch(() => undefined)

  return { saveMutation, deleteMutation, saveError, setSaveError, submit, removeById }
}
