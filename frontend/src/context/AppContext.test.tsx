import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'

describe('AppContext', () => {
  it('should throw an error when useApp is used outside of AppProvider', () => {
    expect(() => {
      renderHook(() => useApp())
    }).toThrow('useApp must be used within an AppProvider')
  })

  it('should provide initialState when wrapped in AppProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    )
    const { result } = renderHook(() => useApp(), { wrapper })

    expect(result.current.state.editorContent).toBe('')
    expect(result.current.state.selectedLanguage).toBe('python')
    expect(result.current.state.selectedMode).toBe('comprehensive')
    expect(result.current.state.reviewResult).toBeNull()
    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.healthStatus).toBeNull()
  })

  it('should update state when dispatch is called', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    )
    const { result } = renderHook(() => useApp(), { wrapper })

    act(() => {
      result.current.dispatch({
        type: 'SET_EDITOR_CONTENT',
        payload: 'print("hello world")',
      })
    })

    expect(result.current.state.editorContent).toBe('print("hello world")')
  })
})
