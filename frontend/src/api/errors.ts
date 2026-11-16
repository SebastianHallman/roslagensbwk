type ApiErrorDetails = {
  status?: number
  code?: string
}

export function getApiErrorDetails(failure: unknown): ApiErrorDetails {
  if (!(failure instanceof Error)) return {}

  return {
    status: 'status' in failure && typeof failure.status === 'number' ? failure.status : undefined,
    code: 'code' in failure && typeof failure.code === 'string' ? failure.code : undefined,
  }
}
