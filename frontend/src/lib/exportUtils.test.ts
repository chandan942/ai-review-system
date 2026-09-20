import { describe, it, expect } from 'vitest'
import { generateMarkdownReport } from './exportUtils'
import type { ReviewResponse } from './types'

describe('exportUtils', () => {
  const mockReview: ReviewResponse = {
    summary: 'Code has several issues.',
    issues: [
      {
        line: 2,
        message: 'Avoid wildcard import',
        severity: 'Medium',
        suggestion: 'from math import sqrt',
        category: 'style',
      },
      {
        line: 5,
        message: 'Possible division by zero',
        severity: 'Critical',
        suggestion: 'if denom != 0:',
        category: 'security',
      },
    ],
    metadata: {
      language: 'python',
      mode: 'security',
      lines_reviewed: 10,
      review_time_ms: 120,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      cached: false,
    },
  }

  it('generates a detailed markdown report correctly', () => {
    const md = generateMarkdownReport(mockReview, 'from math import *\n\nx = 10 / 0', 'python', 'security')
    expect(md).toContain('# AI Code Review Report')
    expect(md).toContain('Code has several issues.')
    expect(md).toContain('Critical:')
    expect(md).toContain('Line 2: Avoid wildcard import')
    expect(md).toContain('Line 5: Possible division by zero')
    expect(md).toContain('from math import *')
    expect(md).toContain('gemini-2.5-flash')
  })

  it('handles empty issues gracefully in markdown report', () => {
    const cleanReview: ReviewResponse = {
      summary: 'Looks good!',
      issues: [],
      metadata: {
        language: 'python',
        mode: 'comprehensive',
        lines_reviewed: 3,
        review_time_ms: 40,
        provider: 'mock',
        model: 'mock',
        cached: false,
      },
    }
    const md = generateMarkdownReport(cleanReview, 'print("clean")', 'python', 'comprehensive')
    expect(md).toContain('No issues identified')
  })
})
