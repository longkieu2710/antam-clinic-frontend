/**
 * Gọi REST API của backend.
 * - Mọi API chi nhánh cần header X-Site (S1 | S2 | S3) → truyền qua tham số `site`.
 * - /api/master/** và /api/hq/** luôn chạy ở trạm trung tâm S0, không cần X-Site.
 * - Lỗi trả về được đổi thành ApiError (thông báo tiếng Việt từ backend, kèm SQLSTATE nếu lỗi CSDL).
 */

export interface ApiErrorBody {
  status: number
  code: string
  message: string
  detail?: string
  sqlState?: string
  site?: string
  fieldErrors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail?: string
  readonly sqlState?: string
  readonly site?: string
  readonly fieldErrors?: Record<string, string>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.detail = body.detail
    this.sqlState = body.sqlState
    this.site = body.site
    this.fieldErrors = body.fieldErrors
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: Method
  body?: unknown
  /** Trạm chi nhánh (S1..S3) — gửi trong header X-Site */
  site?: string
  query?: Record<string, string | undefined | null>
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, site, query } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (site) headers['X-Site'] = site

  let url = path
  if (query) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value)
    })
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: 'Không gọi được backend. Kiểm tra Spring Boot đã chạy ở cổng 8080 chưa.',
    })
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const maybe = data as Partial<ApiErrorBody> | null
    throw new ApiError({
      status: response.status,
      code: maybe?.code ?? `HTTP_${response.status}`,
      message: maybe?.message ?? `Lỗi ${response.status} khi gọi ${path}`,
      detail: maybe?.detail,
      sqlState: maybe?.sqlState,
      site: maybe?.site,
      fieldErrors: maybe?.fieldErrors,
    })
  }
  return data as T
}

/** Thông báo ngắn gọn cho một lỗi bất kỳ (kèm SQLSTATE nếu là lỗi CSDL). */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return error.sqlState ? `${error.message} (SQLSTATE ${error.sqlState})` : error.message
  }
  return error instanceof Error ? error.message : String(error)
}
