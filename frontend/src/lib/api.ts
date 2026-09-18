import axios, { AxiosError } from 'axios'
import type { CodeRequest, ReviewResponse, HealthResponse, ApiError as ApiErrorType } from './types'
import { ApiError } from './types'
import { API_BASE_URL, REQUEST_TIMEOUT } from './constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
})

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Request interceptor for adding request ID
api.interceptors.request.use((config) => {
  const requestId = generateRequestId()
  config.headers['X-Request-ID'] = requestId
  config.metadata = { requestId }
  return config
})

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const requestId = error.config?.metadata?.requestId

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new ApiError('Request timed out. Please try again.', {
        isTimeout: true,
        requestId,
      })
    }

    // Handle network errors (no response from server)
    if (!error.response) {
      throw new ApiError('Network error. Please check your connection.', {
        isNetworkError: true,
        requestId,
      })
    }

    // Handle API errors with response
    const status = error.response.status
    const data = error.response.data

    // Extract user-friendly message from backend error
    let message = 'An error occurred. Please try again.'
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof data.detail === 'string') {
        message = data.detail
      } else if ('message' in data && typeof data.message === 'string') {
        message = data.message
      } else if ('error' in data && typeof data.error === 'string') {
        message = data.error
      }
    }

    throw new ApiError(message, {
      status,
      data,
      requestId,
    })
  }
)

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: ApiErrorType | Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as ApiErrorType | Error

      // Don't retry on client errors (4xx) or certain conditions
      if (error instanceof ApiError) {
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error
        }
        if (!error.isTimeout && !error.isNetworkError && error.status !== 503) {
          throw error
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export const submitCodeReview = async (
  request: CodeRequest
): Promise<ReviewResponse> => {
  return retryWithBackoff(async () => {
    const response = await api.post<ReviewResponse>('/review', request)
    return response as ReviewResponse
  })
}

export const checkHealth = async (): Promise<HealthResponse> => {
  return retryWithBackoff(async () => {
    const response = await api.get<HealthResponse>('/health')
    return response as HealthResponse
  })
}
