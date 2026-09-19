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
  })

  it('renders issue with correct styling based on severity', () => {
    render(<IssueCard issue={mockIssue} />)

    // Check line number
    expect(screen.getByText(/L42/i)).toBeInTheDocument()

    // Check message
    expect(screen.getByText(/Variable is never used/i)).toBeInTheDocument()

    // Check category badge
    expect(screen.getByText(/Style/i)).toBeInTheDocument()

    // Check severity badge (LOW should be blue)
    expect(screen.getByText(/Low/i)).toHaveClass(/bg-blue-500\/10/)
    expect(screen.getByText(/Low/i)).toHaveClass(/text-blue-400/)

    // Check suggestion
    expect(screen.getByText(/Remove unused variable/i)).toBeInTheDocument()

    // Check action buttons
    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /highlight in code/i })).toBeInTheDocument()
  })

  it('changes styling for different severities', () => {
    const severities: IssueSeverity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

    severities.forEach((severity) => {
      const issue: ReviewIssue = {
        line: 1,
        message: 'Test issue',
        severity,
        suggestion: 'Fix this',
        category: 'Test',
      }

      render(<IssueCard issue={issue} />)

      // Check that the correct severity color is applied
      const severityBadge = screen.getByText(severity)
      expect(severityBadge).toBeInTheDocument()

      // Each severity should have its own color class
      switch (severity) {
        case 'Critical':
          expect(severityBadge).toHaveClass(/bg-red-500\/10/)
          expect(severityBadge).toHaveClass(/text-red-400/)
          break
        case 'High':
          expect(severityBadge).toHaveClass(/bg-amber-500\/10/)
          expect(severityBadge).toHaveClass(/text-amber-400/)
          break
        case 'Medium':
          expect(severityBadge).toHaveClass(/bg-yellow-500\/10/)
          expect(severityBadge).toHaveClass(/text-yellow-400/)
          break
        case 'Low':
          expect(severityBadge).toHaveClass(/bg-blue-500\/10/)
          expect(severityBadge).toHaveClass(/text-blue-400/)
          break
        case 'Info':
          expect(severityBadge).toHaveClass(/bg-cyan-500\/10/)
          expect(severityBadge).toHaveClass(/text-cyan-400/)
          break
      }
    })
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