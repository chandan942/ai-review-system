import axios from 'axios'
import type { CodeRequest, ReviewResponse, HealthResponse } from './types'
import { API_BASE_URL, REQUEST_TIMEOUT } from './constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
})

// Request interceptor for adding headers
api.interceptors.request.use((config) => {
  // Add request ID for tracing if needed
  return config
})

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors, timeouts, etc.
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    if (!error.response) {
      throw new Error('Network error. Please check your connection.')
    }
    // Return error data from response
    throw error.response.data
  }
)

export const submitCodeReview = async (
  request: CodeRequest
): Promise<ReviewResponse> => {
  const response = await api.post<ReviewResponse>('/review', request)
  return response as ReviewResponse
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health')
  return response as HealthResponse
}
