import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReviewDashboard from './ReviewDashboard'
import type { ReviewResponse, ReviewIssue } from '../lib/types'
import { IssueSeverity } from '../lib/types'
import { useApp } from '../context/AppContext'

// Mock the useApp hook
vi.mock('../context/AppContext')

const createMockState = (overrides: Partial<any> = {}) => ({
  editorContent: '',
  selectedLanguage: 'python',
  selectedMode: 'comprehensive',
  reviewResult: null,
  isLoading: false,
  error: null,
  filterSeverity: 'all',
  ...overrides,
})

const createMockDispatch = () => vi.fn()

// Helper to set up the mock return value
const setupMock = (stateOverrides: Partial<any> = {}) => {
  const mockState = createMockState(stateOverrides)
  const mockDispatch = createMockDispatch()
  ;(useApp as vi.Mock).mockReturnValue({
    state: mockState,
    dispatch: mockDispatch,
  })
  return { state: mockState, dispatch: mockDispatch }
}

describe('ReviewDashboard Component', () => {
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
      }
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no results', () => {
    setupMock()

    render(<ReviewDashboard />)

    // Get the specific heading for "Review Results" in the header
    const reviewResultsHeading = screen.getAllByRole('heading', { level: 2 }).find(
      heading => heading.textContent === 'Review Results'
    )
    expect(reviewResultsHeading).toBeInTheDocument()
    expect(screen.getByText(/Ready to review your code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear editor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load sample/i })).toBeInTheDocument()
  })

  it('shows loading state when reviewing', () => {
    setupMock({ isLoading: true })

    render(<ReviewDashboard />)

    expect(screen.getByText(/Analyzing code.../i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear/i })).toHaveAttribute('disabled')
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('shows error state when error is present', () => {
    setupMock({ error: 'API connection failed' })

    render(<ReviewDashboard />)

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/API connection failed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders results state with summary banner and issue list when reviewResult exists', () => {
    setupMock({ reviewResult: mockReviewResponse })

    render(<ReviewDashboard />)

    // Summary banner - target the visible banner, not the sr-only live region
    const issuesFoundElements = screen.getAllByText(/Issues Found/i)
    const visibleIssuesFound = issuesFoundElements.find(
      el => !el.closest('[aria-live]')
    )
    expect(visibleIssuesFound).toBeInTheDocument()

    // Get the parent container to scope other queries
    const bannerContainer = visibleIssuesFound.closest('div.flex.flex-col.sm\\:flex-row.sm\\:items-center.sm\\:justify-between')
    expect(bannerContainer).toBeInTheDocument()
    expect(bannerContainer).toHaveTextContent(/15 lines analyzed/i)
    expect(bannerContainer).toHaveTextContent(/320ms/i)
    expect(bannerContainer).toHaveTextContent(/GEMINI/i)
    expect(bannerContainer).toHaveTextContent(/\(Fresh\)/i)

    // Severity filter pills
    expect(screen.getByRole('button', { name: /^All$/i })).toHaveClass(/bg-accent\/20/) // Active by default
    expect(screen.getByRole('button', { name: /^Critical\s*\d*$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^High\s*\d*$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Medium\s*\d*$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Low\s*\d*$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Info\s*\d*$/i })).toBeInTheDocument()

    // Issue count badges on filter pills
    expect(screen.getByRole('button', { name: /^Critical\s*\d*$/i })).toHaveTextContent(/Critical\s*1/i)
    expect(screen.getByRole('button', { name: /^Low\s*\d*$/i })).toHaveTextContent(/Low\s*1/i)

    // Issues list - check visible text, not sr-only
    expect(screen.getByText(/Potential division by zero/i)).toBeInTheDocument()
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()

    // No "No issues match" message when there are issues
    expect(screen.queryByText(/No issues match the selected filters/i)).not.toBeInTheDocument()
  })

  it('tests filter functionality (all severities and individual severity filters)', () => {
    const { dispatch } = setupMock({ reviewResult: mockReviewResponse })

    render(<ReviewDashboard />)

    // Initially shows both issues (filterSeverity: 'all')
    expect(screen.getByText(/Potential division by zero/i)).toBeInTheDocument()
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()

    // Click Critical filter
    fireEvent.click(screen.getByRole('button', { name: /Critical/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_FILTER_SEVERITY', payload: 'Critical' })

    // Should now show only Critical issue
    expect(screen.getByText(/Potential division by zero/i)).toBeInTheDocument()
    expect(screen.queryByText(/Variable is never used/i)).not.toBeInTheDocument()

    // Click Low filter
    fireEvent.click(screen.getByRole('button', { name: /Low/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_FILTER_SEVERITY', payload: 'Low' })

    // Should now show only Low issue
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()
    expect(screen.queryByText(/Potential division by zero/i)).not.toBeInTheDocument()

    // Click All filter
    fireEvent.click(screen.getByRole('button', { name: /All/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_FILTER_SEVERITY', payload: 'all' })

    // Should show both issues again
    expect(screen.getByText(/Potential division by zero/i)).toBeInTheDocument()
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()
  })

  it('shows "No issues match the selected filters" when filter excludes all issues', () => {
    setupMock({
      reviewResult: mockReviewResponse,
      filterSeverity: 'High' // No High issues in mock data
    })

    render(<ReviewDashboard />)

    expect(screen.getByText(/No issues match the selected filters/i)).toBeInTheDocument()
    expect(screen.queryByText(/Potential division by zero/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Variable is never used/i)).not.toBeInTheDocument()
  })

  it('tests clear and retry button interactions', () => {
    // Test clear button in empty state
    const { dispatch } = setupMock()
    render(<ReviewDashboard />)
    fireEvent.click(screen.getByRole('button', { name: /clear editor/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EDITOR_CONTENT', payload: '' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_REVIEW_RESULT', payload: null })
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: null })

    // Test retry button in error state
    const { dispatch: dispatch2 } = setupMock({ error: 'Something went wrong' })
    render(<ReviewDashboard />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(dispatch2).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true })
    expect(dispatch2).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: null })
  })

  it('verifies proper ARIA labels and semantic structure', () => {
    setupMock({ reviewResult: mockReviewResponse })

    render(<ReviewDashboard />)

    // Check for landmark regions
    expect(screen.getByRole('region')).toBeInTheDocument() // The main dashboard container

    // Check that buttons are accessible
    const clearButton = screen.getByRole('button', { name: /clear editor/i })
    expect(clearButton).toBeInTheDocument()

    // Check that list items are properly structured
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2) // Two issues

    // Check that heading levels are correct
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Review Results')
  })
})