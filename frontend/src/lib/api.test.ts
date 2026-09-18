import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import type { ReviewResponse, HealthResponse } from './types'
import { ApiError } from './types'

// Mock axios
vi.mock('axios', () => {
  let reqInterceptor: ((config: any) => any) | null = null
  let respInterceptorSuccess: ((resp: any) => any) | null = null
  let respInterceptorError: ((err: any) => any) | null = null

  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn((fn) => {
          reqInterceptor = fn
        }),
      },
      response: {
        use: vi.fn((success, error) => {
          respInterceptorSuccess = success
          respInterceptorError = error
        }),
      },
    },
    post: vi.fn(),
    get: vi.fn(),
    _getInterceptors: () => ({
      reqInterceptor,
      respInterceptorSuccess,
      respInterceptorError,
    }),
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance,
    },
  }
})

// We'll import after mocking
import { submitCodeReview, checkHealth } from './api'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('submitCodeReview', () => {
    it('should submit code and return review response', async () => {
      const mockResponse: ReviewResponse = {
        summary: 'No issues found',
        issues: [],
        metadata: {
          language: 'python',
          mode: 'comprehensive',
          lines_reviewed: 10,
          review_time_ms: 250,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          cached: false,
        },
      }

      const instance = (axios.create as any)()
      instance.post.mockResolvedValueOnce(mockResponse)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }
      const result = await submitCodeReview(request)

      expect(instance.post).toHaveBeenCalledWith('/review', request)
      expect(result).toEqual(mockResponse)
    })

    it('should retry and eventually fail on timeout error', async () => {
      const instance = (axios.create as any)()
      const timeoutError = new ApiError('Request timed out. Please try again.', {
        isTimeout: true,
      })
      instance.post.mockRejectedValue(timeoutError)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      const promise = submitCodeReview(request)

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow(
        'Request timed out. Please try again.'
      )
      expect(instance.post).toHaveBeenCalledTimes(3)
    })

    it('should retry and eventually fail on network error', async () => {
      const instance = (axios.create as any)()
      const networkError = new ApiError('Network error. Please check your connection.', {
        isNetworkError: true,
      })
      instance.post.mockRejectedValue(networkError)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      const promise = submitCodeReview(request)

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow(
        'Network error. Please check your connection.'
      )
      expect(instance.post).toHaveBeenCalledTimes(3)
    })

    it('should handle API error with response data', async () => {
      const instance = (axios.create as any)()
      const apiError = new ApiError('Invalid request', {
        status: 422,
        data: { detail: 'Invalid request' },
      })
      instance.post.mockRejectedValue(apiError)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      await expect(submitCodeReview(request)).rejects.toThrow('Invalid request')
    })

    it('should retry on 503 errors with exponential backoff', async () => {
      const instance = (axios.create as any)()
      const serviceError = new ApiError('Service unavailable', {
        status: 503,
      })
      const mockResponse: ReviewResponse = {
        summary: 'No issues found',
        issues: [],
        metadata: {
          language: 'python',
          mode: 'comprehensive',
          lines_reviewed: 10,
          review_time_ms: 250,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          cached: false,
        },
      }

      instance.post
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError)
        .mockResolvedValueOnce(mockResponse)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      const promise = submitCodeReview(request)

      // Fast-forward through retry delays
      await vi.advanceTimersByTimeAsync(1000) // First retry delay
      await vi.advanceTimersByTimeAsync(2000) // Second retry delay

      const result = await promise

      expect(instance.post).toHaveBeenCalledTimes(3)
      expect(result).toEqual(mockResponse)
    })

    it('should not retry on 4xx client errors', async () => {
      const instance = (axios.create as any)()
      const clientError = new ApiError('Bad request', {
        status: 400,
      })
      instance.post.mockRejectedValue(clientError)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      await expect(submitCodeReview(request)).rejects.toThrow('Bad request')
      expect(instance.post).toHaveBeenCalledTimes(1)
    })

    it('should retry on timeout errors', async () => {
      const instance = (axios.create as any)()
      const timeoutError = new ApiError('Request timed out. Please try again.', {
        isTimeout: true,
      })
      const mockResponse: ReviewResponse = {
        summary: 'No issues found',
        issues: [],
        metadata: {
          language: 'python',
          mode: 'comprehensive',
          lines_reviewed: 10,
          review_time_ms: 250,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          cached: false,
        },
      }

      instance.post
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockResponse)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      const promise = submitCodeReview(request)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(instance.post).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockResponse)
    })

    it('should fail after max retries', async () => {
      const instance = (axios.create as any)()
      const serviceError = new ApiError('Service unavailable', {
        status: 503,
      })
      instance.post.mockRejectedValue(serviceError)

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      const promise = submitCodeReview(request)

      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow('Service unavailable')
      expect(instance.post).toHaveBeenCalledTimes(3)
    })
  })

  describe('checkHealth', () => {
    it('should fetch health status', async () => {
      const mockResponse: HealthResponse = {
        status: 'ok',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        cache_size: 100,
        supported_languages: ['python', 'javascript'],
        supported_modes: ['comprehensive', 'security'],
        version: '1.0.0',
      }

      const instance = (axios.create as any)()
      instance.get.mockResolvedValueOnce(mockResponse)

      const result = await checkHealth()

      expect(instance.get).toHaveBeenCalledWith('/health')
      expect(result).toEqual(mockResponse)
    })

    it('should retry and eventually fail on timeout error', async () => {
      const instance = (axios.create as any)()
      const timeoutError = new ApiError('Request timed out. Please try again.', {
        isTimeout: true,
      })
      instance.get.mockRejectedValue(timeoutError)

      const promise = checkHealth()

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow(
        'Request timed out. Please try again.'
      )
      expect(instance.get).toHaveBeenCalledTimes(3)
    })

    it('should retry and eventually fail on network error', async () => {
      const instance = (axios.create as any)()
      const networkError = new ApiError('Network error. Please check your connection.', {
        isNetworkError: true,
      })
      instance.get.mockRejectedValue(networkError)

      const promise = checkHealth()

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow(
        'Network error. Please check your connection.'
      )
      expect(instance.get).toHaveBeenCalledTimes(3)
    })

    it('should retry on network errors', async () => {
      const instance = (axios.create as any)()
      const networkError = new ApiError('Network error. Please check your connection.', {
        isNetworkError: true,
      })
      const mockResponse: HealthResponse = {
        status: 'ok',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        cache_size: 100,
        supported_languages: ['python', 'javascript'],
        supported_modes: ['comprehensive', 'security'],
        version: '1.0.0',
      }

      instance.get
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockResponse)

      const promise = checkHealth()
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(instance.get).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Interceptors', () => {
    it('request interceptor adds X-Request-ID header', () => {
      const instance = (axios.create as any)()
      const { reqInterceptor } = (instance as any)._getInterceptors()
      const config = { headers: {} }
      const result = reqInterceptor(config)

      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(result.metadata.requestId).toBeDefined()
    })

    it('response interceptor extracts data', () => {
      const instance = (axios.create as any)()
      const { respInterceptorSuccess } = (instance as any)._getInterceptors()
      const response = { data: { test: 'data' } }
      expect(respInterceptorSuccess(response)).toEqual({ test: 'data' })
    })

    it('response interceptor handles ECONNABORTED error', () => {
      const instance = (axios.create as any)()
      const { respInterceptorError } = (instance as any)._getInterceptors()
      const error = { code: 'ECONNABORTED', config: { metadata: { requestId: 'test-123' } } }

      try {
        respInterceptorError(error)
        fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect((e as ApiError).message).toBe('Request timed out. Please try again.')
        expect((e as ApiError).isTimeout).toBe(true)
        expect((e as ApiError).requestId).toBe('test-123')
      }
    })

    it('response interceptor handles missing response (network error)', () => {
      const instance = (axios.create as any)()
      const { respInterceptorError } = (instance as any)._getInterceptors()
      const error = { config: { metadata: { requestId: 'test-456' } } }

      try {
        respInterceptorError(error)
        fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect((e as ApiError).message).toBe('Network error. Please check your connection.')
        expect((e as ApiError).isNetworkError).toBe(true)
        expect((e as ApiError).requestId).toBe('test-456')
      }
    })

    it('response interceptor throws ApiError on API errors with detail', () => {
      const instance = (axios.create as any)()
      const { respInterceptorError } = (instance as any)._getInterceptors()
      const error = {
        response: {
          status: 422,
          data: { detail: 'Validation error' },
        },
        config: { metadata: { requestId: 'test-789' } },
      }

      try {
        respInterceptorError(error)
        fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect((e as ApiError).message).toBe('Validation error')
        expect((e as ApiError).status).toBe(422)
        expect((e as ApiError).requestId).toBe('test-789')
      }
    })

    it('response interceptor handles generic API error', () => {
      const instance = (axios.create as any)()
      const { respInterceptorError } = (instance as any)._getInterceptors()
      const error = {
        response: {
          status: 500,
          data: {},
        },
        config: { metadata: { requestId: 'test-abc' } },
      }

      try {
        respInterceptorError(error)
        fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect((e as ApiError).message).toBe('An error occurred. Please try again.')
        expect((e as ApiError).status).toBe(500)
      }
    })
  })

  describe('ApiError', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError('Test error', {
        status: 404,
        data: { detail: 'Not found' },
        requestId: 'req-123',
        isTimeout: true,
        isNetworkError: false,
      })

      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.data).toEqual({ detail: 'Not found' })
      expect(error.requestId).toBe('req-123')
      expect(error.isTimeout).toBe(true)
      expect(error.isNetworkError).toBe(false)
    })

    it('should create ApiError with minimal properties', () => {
      const error = new ApiError('Simple error')

      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('Simple error')
      expect(error.status).toBeUndefined()
      expect(error.isTimeout).toBe(false)
      expect(error.isNetworkError).toBe(false)
    })
  })
})
