import { render, screen, fireEvent } from '@testing-library/react'
import IssueCard from './IssueCard'
import type { ReviewIssue } from '../lib/types'
import { IssueSeverity } from '../lib/types'

describe('IssueCard Component', () => {
  const mockIssue: ReviewIssue = {
    line: 42,
    message: 'Variable is never used',
    severity: IssueSeverity.LOW,
    suggestion: 'Remove unused variable `temp`',
    category: 'Style',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
    })
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('renders issue with correct styling based on severity', () => {
    render(<IssueCard issue={mockIssue} />)

    // Check line number (now shows as "L42")
    expect(screen.getByText(/L42/i)).toBeInTheDocument()

    // Check message
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()

    // Check category (now shows as "Style" in paragraph)
    expect(screen.getByText(/Style/i)).toBeInTheDocument()

    // Check severity is shown via colored dot (not text)
    // The severity dot is the first child of the inner flex container
    const innerFlexContainer = screen.getByText(/L42 • Style/i).parentElement?.parentElement
    if (innerFlexContainer) {
      // Get the first child (the dot) of the inner flex container
      const dotContainer = innerFlexContainer.firstElementChild as HTMLElement
      expect(dotContainer).toHaveClass(/bg-blue-500\/10/)
      expect(dotContainer).toHaveClass(/text-blue-400/)
    }

    // Check suggestion
    expect(screen.getByText(/Remove unused variable/i)).toBeInTheDocument()

    // Check action buttons
    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /highlight in code/i })).toBeInTheDocument()
  })

  it.each([
    [IssueSeverity.CRITICAL, 'bg-red-500/10', 'text-red-400'],
    [IssueSeverity.HIGH, 'bg-amber-500/10', 'text-amber-400'],
    [IssueSeverity.MEDIUM, 'bg-yellow-500/10', 'text-yellow-400'],
    [IssueSeverity.LOW, 'bg-blue-500/10', 'text-blue-400'],
    [IssueSeverity.INFO, 'bg-cyan-500/10', 'text-cyan-400'],
  ])('changes styling for severity %s', (severity, bgClass, textClass) => {
    const issue: ReviewIssue = {
      line: 1,
      message: 'Test issue',
      severity,
      suggestion: 'Fix this',
      category: 'Test',
    }

    render(<IssueCard issue={issue} />)

    // Check that the correct severity color is applied via the dot
    // The severity dot is the first child of the inner flex container
    const lineCategoryElement = screen.getByText(/L1 • Test/i)
    const innerFlexContainer = lineCategoryElement.parentElement?.parentElement
    if (innerFlexContainer) {
      // Get the first child (the dot) of the inner flex container
      const dotContainer = innerFlexContainer.firstElementChild as HTMLElement
      expect(dotContainer).toBeInTheDocument()
      expect(dotContainer).toHaveClass(bgClass)
      expect(dotContainer).toHaveClass(textClass)
    }
  })

  it('handles copy fix button click', () => {
    const clipboardWriteTextSpy = vi.spyOn(navigator.clipboard, 'writeText')

    render(<IssueCard issue={mockIssue} />)

    fireEvent.click(screen.getByRole('button', { name: /copy fix/i }))

    expect(clipboardWriteTextSpy).toHaveBeenCalledWith(mockIssue.suggestion)
  })

  it('handles highlight button click', () => {
    const alertSpy = vi.spyOn(window, 'alert')

    render(<IssueCard issue={mockIssue} />)

    fireEvent.click(screen.getByRole('button', { name: /highlight in code/i }))

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Highlighting line ${mockIssue.line}`)
    )
  })
})