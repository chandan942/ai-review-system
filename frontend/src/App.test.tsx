import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { AppProvider } from './context/AppContext'
import type { ReviewResponse } from './lib/types'
import { IssueSeverity } from './lib/types'
import * as api from './lib/api'

// Mock api
vi.mock('./lib/api', () => ({
  checkHealth: vi.fn(),
  submitCodeReview: vi.fn(),
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <textarea
      aria-label="Monaco Editor Input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

const mockReviewResponse: ReviewResponse = {
  summary: 'Found 2 issues',
  issues: [
    {
      line: 5,
      message: 'Potential division by zero',
      severity: IssueSeverity.CRITICAL,
      suggestion: 'Add a guard clause to check for zero',
      category: 'Logic',
    },
    {
      line: 12,
      message: 'Variable is never used',
      severity: IssueSeverity.LOW,
      suggestion: 'Remove unused variable',
      category: 'Style',
    },
  ],
  metadata: {
    language: 'python',
    mode: 'comprehensive',
    lines_reviewed: 15,
    review_time_ms: 320,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    cached: false,
  },
}

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.checkHealth).mockResolvedValue({
      status: 'ok',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      cache_size: 50,
      supported_languages: ['python', 'javascript'],
      supported_modes: ['comprehensive', 'security'],
      version: '1.0.0',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the main app components (header, editor, dashboard)', async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    // Header
    expect(screen.getByRole('heading', { level: 1, name: /ai code reviewer/i })).toBeInTheDocument()

    // Editor section
    expect(screen.getByRole('region', { name: /code editor/i })).toBeInTheDocument()

    // Review Dashboard section
    expect(screen.getByRole('region', { name: /review results/i })).toBeInTheDocument()
    expect(screen.getByText(/ready to review your code/i)).toBeInTheDocument()
  })

  it('handles code submission and displays review results', async () => {
    vi.mocked(api.submitCodeReview).mockResolvedValueOnce(mockReviewResponse)

    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    const textarea = screen.getByLabelText(/monaco editor input/i)
    fireEvent.change(textarea, { target: { value: 'def div(a, b):\n    return a / b' } })

    const submitBtn = screen.getByRole('button', { name: /review code/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.submitCodeReview).toHaveBeenCalledWith({
        code: 'def div(a, b):\n    return a / b',
        language: 'python',
        mode: 'comprehensive',
      })
    })

    await waitFor(() => {
      // Check visible "Issues Found" text (not in sr-only live region)
      const issuesFoundElements = screen.getAllByText(/2 Issues Found/i)
      const visibleIssuesFound = issuesFoundElements.find(
        el => !el.closest('[aria-live]')
      )
      expect(visibleIssuesFound).toBeInTheDocument()
      expect(screen.getByText(/Potential division by zero/i)).toBeInTheDocument()
      expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()
    })
  })

  it('handles API error during submission and shows error state in dashboard', async () => {
    vi.mocked(api.submitCodeReview).mockRejectedValueOnce(new Error('Review failed: Model unavailable'))

    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    const textarea = screen.getByLabelText(/monaco editor input/i)
    fireEvent.change(textarea, { target: { value: 'test code' } })

    const submitBtn = screen.getByRole('button', { name: /review code/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/review failed: model unavailable/i)).toBeInTheDocument()
    })
  })

  it('handles Ctrl+Enter keyboard shortcut to trigger review', async () => {
    vi.mocked(api.submitCodeReview).mockResolvedValueOnce(mockReviewResponse)

    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    const textarea = screen.getByLabelText(/monaco editor input/i)
    fireEvent.change(textarea, { target: { value: 'print("hello world")' } })

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

    await waitFor(() => {
      expect(api.submitCodeReview).toHaveBeenCalledWith({
        code: 'print("hello world")',
        language: 'python',
        mode: 'comprehensive',
      })
    })

    await waitFor(() => {
      // Check visible "Issues Found" text (not in sr-only live region)
      const issuesFoundElements = screen.getAllByText(/2 Issues Found/i)
      const visibleIssuesFound = issuesFoundElements.find(
        el => !el.closest('[aria-live]')
      )
      expect(visibleIssuesFound).toBeInTheDocument()
    })
  })

  it('clears editor content and review results on clear button click', async () => {
    vi.mocked(api.submitCodeReview).mockResolvedValueOnce(mockReviewResponse)

    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    const textarea = screen.getByLabelText(/monaco editor input/i) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'some code' } })

    const submitBtn = screen.getByRole('button', { name: /review code/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Check visible "Issues Found" text (not in sr-only live region)
      const issuesFoundElements = screen.getAllByText(/2 Issues Found/i)
      const visibleIssuesFound = issuesFoundElements.find(
        el => !el.closest('[aria-live]')
      )
      expect(visibleIssuesFound).toBeInTheDocument()
    })

    const clearBtn = screen.getByRole('button', { name: /^clear$/i })
    fireEvent.click(clearBtn)

    expect(textarea.value).toBe('')
    // Check that there are no visible "Issues Found" texts (not in sr-only live regions)
    const allIssuesFoundElements = screen.queryAllByText(/2 Issues Found/i)
    const visibleIssuesFoundElements = allIssuesFoundElements.filter(
      el => !el.closest('[aria-live]')
    )
    expect(visibleIssuesFoundElements).toHaveLength(0)
    expect(screen.getByText(/ready to review your code/i)).toBeInTheDocument()
  })

  it('disables submit button when editor content is empty', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    )

    const submitBtn = screen.getByRole('button', { name: /review code/i })
    expect(submitBtn).toBeDisabled()
  })
})
