import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppProvider, useApp } from '../context/AppContext'
import CodeEditor from './CodeEditor'
import { SupportedLanguage, IssueSeverity } from '../lib/types'
import React from 'react'

let mockEditorInstance: any
let mockMonacoInstance: any

vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, onMount }: any) => {
      mockEditorInstance = {
        getModel: vi.fn(() => ({})),
        deltaDecorations: vi.fn((_old: any, next: any) => next || []),
        onDidFocusEditorText: vi.fn((cb) => {
          mockEditorInstance._focusCb = cb
        }),
        onDidBlurEditorText: vi.fn((cb) => {
          mockEditorInstance._blurCb = cb
        }),
        _focusCb: null,
        _blurCb: null,
      }

      mockMonacoInstance = {
        Range: class {
          startLineNumber: number
          startColumn: number
          endLineNumber: number
          endColumn: number
          constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
            this.startLineNumber = startLine
            this.startColumn = startCol
            this.endLineNumber = endLine
            this.endColumn = endCol
          }
        },
        editor: {
          setModelLanguage: vi.fn(),
          setTheme: vi.fn(),
          OverviewRulerLane: { Left: 1 },
        },
      }

      if (onMount) {
        onMount(mockEditorInstance, mockMonacoInstance)
      }

      return (
        <div data-testid="monaco-editor-mock">
          <textarea
            data-testid="monaco-textarea"
            aria-label="Code Input"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        </div>
      )
    },
  }
})

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>)
}

describe('CodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders editor container with semantic section landmark and title', () => {
    renderWithProvider(<CodeEditor />)
    const section = screen.getByRole('region', { name: /Code Editor/i })
    expect(section).toBeInTheDocument()
  })

  it('displays the selected language and initial line count in toolbar', () => {
    renderWithProvider(<CodeEditor />)
    expect(screen.getByText(/PYTHON/i)).toBeInTheDocument()
    expect(screen.getByText(/1 lines/i)).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 15,000 chars/i)).toBeInTheDocument()
  })

  it('updates editor content in context when typed into textarea', () => {
    renderWithProvider(<CodeEditor />)
    const textarea = screen.getByTestId('monaco-textarea')

    fireEvent.change(textarea, { target: { value: 'def hello_world():\n    return True\n' } })

    expect(screen.getByText(/3 lines/i)).toBeInTheDocument()
    // Check that char count is displayed (exact number may vary)
    expect(screen.getByText(/\d+\s*\/\s*15,000\s*chars/i)).toBeInTheDocument()
  })

  it('shows near limit warning when characters exceed threshold', () => {
    const TestComponent = () => {
      const { dispatch } = useApp()
      React.useEffect(() => {
        dispatch({
          type: 'SET_EDITOR_CONTENT',
          payload: 'x'.repeat(14000),
        })
      }, [dispatch])
      return <CodeEditor />
    }

    renderWithProvider(<TestComponent />)
    expect(screen.getByText(/Near Limit/i)).toBeInTheDocument()
  })

  it('applies focus and blur styling when editor focus changes', () => {
    renderWithProvider(<CodeEditor />)
    const section = screen.getByRole('region', { name: /Code Editor/i })

    // Initially, should have unfocused styling
    expect(section).toHaveClass('border-border')
    expect(section).not.toHaveClass('border-accent/60')
    expect(section).not.toHaveClass('ring-2')
    expect(section).not.toHaveClass('ring-accent/10')
    expect(section).not.toHaveClass('shadow-md')

    // Simulate focus
    if (mockEditorInstance._focusCb) {
      act(() => {
        mockEditorInstance._focusCb()
      })
    }

    // After focus, should have focused styling
    expect(section).toHaveClass('border-accent/60')
    expect(section).toHaveClass('ring-2')
    expect(section).toHaveClass('ring-accent/10')
    expect(section).toHaveClass('shadow-md')
    expect(section).not.toHaveClass('border-border')
  })

  it('updates Monaco model language when selectedLanguage changes', () => {
    const TestComponent = () => {
      const { dispatch } = useApp()
      React.useEffect(() => {
        dispatch({
          type: 'SET_LANGUAGE',
          payload: SupportedLanguage.TYPESCRIPT,
        })
      }, [dispatch])
      return <CodeEditor />
    }

    renderWithProvider(<TestComponent />)
    expect(mockMonacoInstance.editor.setModelLanguage).toHaveBeenCalledWith(
      expect.anything(),
      'typescript'
    )
  })

  it('decorates lines with issues when reviewResult is present', () => {
    const TestComponent = () => {
      const { dispatch } = useApp()
      React.useEffect(() => {
        dispatch({
          type: 'SET_REVIEW_RESULT',
          payload: {
            summary: 'Found issues',
            issues: [
              {
                line: 5,
                message: 'Hardcoded secret',
                severity: IssueSeverity.CRITICAL,
                suggestion: 'Use environment variables',
              },
              {
                line: 12,
                message: 'Unused import',
                severity: IssueSeverity.LOW,
                suggestion: 'Remove unused import',
              },
            ],
            metadata: {
              language: 'python',
              mode: 'security',
              lines_reviewed: 20,
              review_time_ms: 120,
              provider: 'gemini',
              model: 'gemini-2.5-flash',
              cached: false,
            },
          },
        })
      }, [dispatch])
      return <CodeEditor />
    }

    renderWithProvider(<TestComponent />)
    expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled()
  })
})
