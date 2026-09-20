import { describe, it, expect } from 'vitest'
import { appReducer, initialState, AppAction } from './AppReducer'

describe('App Reducer', () => {
  it('should set editor content', () => {
    const action: AppAction = {
      type: 'SET_EDITOR_CONTENT',
      payload: 'console.log("hello")',
    }
    const state = appReducer(initialState, action)
    expect(state.editorContent).toBe('console.log("hello")')
  })

  it('should set language', () => {
    const action: AppAction = {
      type: 'SET_LANGUAGE',
      payload: 'javascript',
    }
    const state = appReducer(initialState, action)
    expect(state.selectedLanguage).toBe('javascript')
  })

  it('should set mode', () => {
    const action: AppAction = {
      type: 'SET_MODE',
      payload: 'security',
    }
    const state = appReducer(initialState, action)
    expect(state.selectedMode).toBe('security')
  })

  it('should set loading state', () => {
    const action: AppAction = {
      type: 'SET_LOADING',
      payload: true,
    }
    const state = appReducer(initialState, action)
    expect(state.isLoading).toBe(true)
  })

  it('should set review result', () => {
    const mockResult = {
      summary: 'Test',
      issues: [],
      metadata: {
        language: 'python',
        mode: 'comprehensive',
        lines_reviewed: 5,
        review_time_ms: 100,
        provider: 'mock',
        model: 'mock',
        cached: false,
      },
    }
    const action: AppAction = {
      type: 'SET_REVIEW_RESULT',
      payload: mockResult,
    }
    const state = appReducer(initialState, action)
    expect(state.reviewResult).toEqual(mockResult)
  })

  it('should clear review result', () => {
    const stateWithResult = {
      ...initialState,
      reviewResult: {
        summary: 'Test',
        issues: [],
        metadata: {
          language: 'python',
          mode: 'comprehensive',
          lines_reviewed: 5,
          review_time_ms: 100,
          provider: 'mock',
          model: 'mock',
          cached: false,
        },
      },
    }
    const action: AppAction = {
      type: 'SET_REVIEW_RESULT',
      payload: null,
    }
    const state = appReducer(stateWithResult, action)
    expect(state.reviewResult).toBeNull()
  })

  it('should set error', () => {
    const action: AppAction = {
      type: 'SET_ERROR',
      payload: 'Something went wrong',
    }
    const state = appReducer(initialState, action)
    expect(state.error).toBe('Something went wrong')
  })

  it('should clear error', () => {
    const stateWithError = {
      ...initialState,
      error: 'Previous error',
    }
    const action: AppAction = {
      type: 'SET_ERROR',
      payload: null,
    }
    const state = appReducer(stateWithError, action)
    expect(state.error).toBeNull()
  })

  it('should set health status', () => {
    const mockHealth = {
      status: 'healthy',
      provider: 'openrouter',
      model: 'anthropic/claude-3-5-sonnet-20241022',
      cache_size: 0,
      supported_languages: ['python', 'javascript'],
      supported_modes: ['comprehensive', 'security'],
      version: '1.0.0',
    }
    const action: AppAction = {
      type: 'SET_HEALTH_STATUS',
      payload: mockHealth,
    }
    const state = appReducer(initialState, action)
    expect(state.healthStatus).toEqual(mockHealth)
  })

  it('should reset state', () => {
    const modifiedState = {
      editorContent: 'test code',
      selectedLanguage: 'javascript' as const,
      selectedMode: 'security' as const,
      reviewResult: {
        summary: 'Test',
        issues: [],
        metadata: {
          language: 'javascript',
          mode: 'security',
          lines_reviewed: 10,
          review_time_ms: 200,
          provider: 'test',
          model: 'test',
          cached: false,
        },
      },
      isLoading: true,
      error: 'Some error',
      healthStatus: { status: 'healthy' },
    }
    const action: AppAction = {
      type: 'RESET_STATE',
    }
    const state = appReducer(modifiedState, action)
    expect(state).toEqual(initialState)
  })

  it('should preserve unrelated state when setting editor content', () => {
    const currentState = {
      ...initialState,
      selectedLanguage: 'javascript' as const,
      selectedMode: 'security' as const,
    }
    const action: AppAction = {
      type: 'SET_EDITOR_CONTENT',
      payload: 'new code',
    }
    const state = appReducer(currentState, action)
    expect(state.selectedLanguage).toBe('javascript')
    expect(state.selectedMode).toBe('security')
    expect(state.editorContent).toBe('new code')
  })

  it('should handle history actions', () => {
    const mockItem = {
      id: 'item-1',
      timestamp: Date.now(),
      code: 'print("hello")',
      language: 'python' as const,
      mode: 'comprehensive' as const,
      result: {
        summary: 'Clean code',
        issues: [],
        metadata: {
          language: 'python',
          mode: 'comprehensive',
          lines_reviewed: 1,
          review_time_ms: 50,
          provider: 'mock',
          model: 'mock',
          cached: false,
        },
      },
    }

    // SET_HISTORY
    let state = appReducer(initialState, {
      type: 'SET_HISTORY',
      payload: [mockItem],
    })
    expect(state.history).toHaveLength(1)
    expect(state.history[0].id).toBe('item-1')

    // ADD_TO_HISTORY
    const mockItem2 = { ...mockItem, id: 'item-2' }
    state = appReducer(state, {
      type: 'ADD_TO_HISTORY',
      payload: mockItem2,
    })
    expect(state.history).toHaveLength(2)
    expect(state.history[0].id).toBe('item-2')

    // SET_VIEW_MODE
    state = appReducer(state, {
      type: 'SET_VIEW_MODE',
      payload: 'history',
    })
    expect(state.viewMode).toBe('history')

    // CLEAR_HISTORY
    state = appReducer(state, {
      type: 'CLEAR_HISTORY',
    })
    expect(state.history).toHaveLength(0)
  })

  it('should return same state for unknown action type', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any
    const state = appReducer(initialState, action)
    expect(state).toBe(initialState)
  })
})
