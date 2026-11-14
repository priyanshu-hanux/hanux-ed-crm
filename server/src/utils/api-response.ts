import type { Response } from "express"

/** Response shapes. Keep in sync with client/src/types/api-response.ts. */
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  { status = 200, message }: { status?: number; message?: string } = {}
) {
  const body: ApiResponse<T> = { success: true, data }
  if (message) body.message = message
  return res.status(status).json(body)
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  { total, page, limit }: Omit<Pagination, "totalPages">
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}
