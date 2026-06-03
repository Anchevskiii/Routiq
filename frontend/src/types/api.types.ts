export interface ApiResponse<T = unknown> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    sharedCount?: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
    details?: Record<string, unknown>
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}
