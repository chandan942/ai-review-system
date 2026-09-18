import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import type { ReviewResponse, HealthResponse } from './types'

// Mock axios
vi.mock('axios', () => {
  let reqInterceptor: ((config: unknown) => unknown) | null = null
  let respInterceptorSuccess: ((resp: unknown) => unknown) | null = null
  let respInterceptorError: ((err: unknown) => unknown) | null = null

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

      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
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

    it('should handle timeout error', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.post.mockRejectedValueOnce(
        new Error('Request timed out. Please try again.')
      )

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      await expect(submitCodeReview(request)).rejects.toThrow(
        'Request timed out. Please try again.'
      )
    })

    it('should handle network error', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.post.mockRejectedValueOnce(
        new Error('Network error. Please check your connection.')
      )

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      await expect(submitCodeReview(request)).rejects.toThrow(
        'Network error. Please check your connection.'
      )
    })

    it('should handle API error with response data', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.post.mockRejectedValueOnce({ error: 'Invalid request' })

      const request = {
        code: 'print("hello")',
        language: 'python' as const,
        mode: 'comprehensive' as const,
      }

      await expect(submitCodeReview(request)).rejects.toEqual({ error: 'Invalid request' })
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

      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.get.mockResolvedValueOnce(mockResponse)

      const result = await checkHealth()

      expect(instance.get).toHaveBeenCalledWith('/health')
      expect(result).toEqual(mockResponse)
    })

    it('should handle timeout error', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.get.mockRejectedValueOnce(
        new Error('Request timed out. Please try again.')
      )

      await expect(checkHealth()).rejects.toThrow(
        'Request timed out. Please try again.'
      )
    })

    it('should handle network error', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.get.mockRejectedValueOnce(
        new Error('Network error. Please check your connection.')
      )

      await expect(checkHealth()).rejects.toThrow(
        'Network error. Please check your connection.'
      )
    })

    it('should handle API error with response data', async () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      instance.get.mockRejectedValueOnce({ error: 'Service unavailable' })

      await expect(checkHealth()).rejects.toEqual({ error: 'Service unavailable' })
    })
  })

  describe('Interceptors', () => {
    it('request interceptor passes config through', () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      const { reqInterceptor } = (instance as unknown as { _getInterceptors: () => { reqInterceptor: (config: unknown) => unknown } })._getInterceptors()
      const config = { headers: {} }
      expect(reqInterceptor(config)).toEqual(config)
    })

    it('response interceptor extracts data', () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      const { respInterceptorSuccess } = (instance as unknown as { _getInterceptors: () => { respInterceptorSuccess: (resp: { data: unknown }) => unknown } })._getInterceptors()
      const response = { data: { test: 'data' } }
      expect(respInterceptorSuccess(response)).toEqual({ test: 'data' })
    })

    it('response interceptor handles ECONNABORTED error', () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      const { respInterceptorError } = (instance as unknown as { _getInterceptors: () => { respInterceptorError: (err: unknown) => unknown } })._getInterceptors()
      expect(() =>
        respInterceptorError({ code: 'ECONNABORTED' })
      ).toThrow('Request timed out. Please try again.')
    })

    it('response interceptor handles missing response (network error)', () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      const { respInterceptorError } = (instance as unknown as { _getInterceptors: () => { respInterceptorError: (err: unknown) => unknown } })._getInterceptors()
      expect(() =>
        respInterceptorError({})
      ).toThrow('Network error. Please check your connection.')
    })

    it('response interceptor throws response data on API errors', () => {
      const instance = (axios.create as unknown as ReturnType<typeof vi.fn>)()
      const { respInterceptorError } = (instance as unknown as { _getInterceptors: () => { respInterceptorError: (err: unknown) => unknown } })._getInterceptors()
      expect(() =>
        respInterceptorError({ response: { data: { detail: 'Bad request' } } })
      ).toThrow()
    })
  })
})
