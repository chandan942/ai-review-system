import { useApp } from '../context/AppContext'
import IssueCard from './IssueCard'
import { useEffect, useState } from 'react'
import type { ReviewIssue } from '../lib/types'
import { IssueSeverity } from '../lib/types'
import { exportAsMarkdown, exportAsJson } from '../lib/exportUtils'

const ReviewDashboard: React.FC = () => {
  const { state, dispatch } = useApp()
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>(state.filterSeverity || 'all')
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    setFilterSeverity(state.filterSeverity || 'all')
  }, [state.filterSeverity])

  const handleFilterChange = (severity: IssueSeverity | 'all') => {
    setFilterSeverity(severity)
    dispatch({ type: 'SET_FILTER_SEVERITY', payload: severity })
  }

  // Handle retry when error occurs
  const handleRetry = () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // Clear results
  const handleClear = () => {
    dispatch({ type: 'SET_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'SET_REVIEW_RESULT', payload: null })
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // Handle Export
  const handleExportMd = () => {
    if (!state.reviewResult) return
    exportAsMarkdown(
      state.reviewResult,
      state.editorContent,
      state.selectedLanguage,
      state.selectedMode
    )
    setShowExportMenu(false)
  }

  const handleExportJson = () => {
    if (!state.reviewResult) return
    exportAsJson(
      state.reviewResult,
      state.editorContent,
      state.selectedLanguage,
      state.selectedMode
    )
    setShowExportMenu(false)
  }

  // Filter issues based on selected severity
  const filteredIssues = state.reviewResult?.issues.filter(
    issue =>
      filterSeverity === 'all' ||
      issue.severity === filterSeverity
  ) || []

  return (
    <>
      {state.reviewResult && (
        <div
          aria-live="polite"
          className="sr-only"
        >
          Review complete: {state.reviewResult.issues.length} issues found
        </div>
      )}
      <section
        role="region"
        aria-label="Review Results"
        className="flex-1 flex flex-col bg-card border border-border/20 rounded-lg overflow-hidden"
      >
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border/20">
        <div className="flex-1 sm:flex-shrink-0">
          <h2 className="text-xl font-bold tracking-tight">
            Review Results
          </h2>
          {state.reviewResult?.summary && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              {state.reviewResult.summary}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {/* Clear Button */}
          <button
            onClick={handleClear}
            disabled={state.isLoading}
            aria-label={state.reviewResult ? "Clear editor" : "Clear"}
            className="px-3 py-1.5 text-sm font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>

          {/* Retry Button (shown when error) */}
          {state.error && (
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 text-sm font-medium rounded bg-accent/20 text-accent hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98]"
            >
              Retry
            </button>
          )}

          {/* Export Menu Button */}
          {state.reviewResult && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 text-sm font-medium rounded flex items-center gap-1 hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98]"
              >
                Export
                <span className="ml-0.5 text-xs">⌵</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur rounded-md shadow-lg border border-border/20 z-20">
                  <button
                    onClick={handleExportMd}
                    className="w-full text-left px-4 py-2 text-sm font-medium border-b border-border/20 hover:bg-bg/10 transition-colors"
                  >
                    📄 Markdown Report
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-bg/10 transition-colors"
                  >
                    📊 JSON Data
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Loading State */}
        {state.isLoading && !state.reviewResult && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing code...
            </p>
            {state.reviewResult?.metadata?.provider && (
              <p className="mt-1 text-xs text-muted-foreground">
                Using {state.reviewResult.metadata.provider}
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {state.error && !state.isLoading && !state.reviewResult && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 mb-3 flex items-center justify-center rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {state.error}
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!state.isLoading && !state.error && !state.reviewResult && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-400 mb-6 flex items-center justify-center rounded-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="font-bold mb-3">Ready to review your code</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Paste code in the editor on the left, select your language and review mode, then click "Review" or press Ctrl+Enter.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleClear}
                className="flex-1 sm:flex-shrink-0 px-4 py-2 bg-bg/20 text-sm font-medium rounded hover:bg-bg/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98]"
              >
                Clear Editor
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: 'SET_EDITOR_CONTENT',
                    payload: 'def calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n\nresult = calculate_average([1, 2, 3, 4, 5])\nprint(f"Average: {result}")'
                  })
                }}
                className="flex-1 sm:flex-shrink-0 px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98]"
              >
                Load Sample
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: Use Ctrl+Enter to submit for review
            </p>
          </div>
        )}

        {/* Results State */}
        {state.reviewResult && !state.isLoading && (
          <div className="space-y-4">
            {/* Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-3 bg-bg/10 rounded-lg border border-border/20">
              <div className="flex-1 space-x-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-accent rounded" />
                  <span className="text-sm font-medium">
                    {state.reviewResult.issues.length} Issues Found
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.reviewResult.metadata.lines_reviewed} lines analyzed •
                  {state.reviewResult.metadata.review_time_ms}ms •
                  {state.reviewResult.metadata.provider.toUpperCase()} •
                  {state.reviewResult.metadata.cached ? '(Cached)' : '(Fresh)'}
                </p>
              </div>

              {/* Severity Filter Pills */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98]
                    ${filterSeverity === 'all' ? 'bg-accent/20 text-accent' : ''}
                  `}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </button>
                {[IssueSeverity.CRITICAL, IssueSeverity.HIGH, IssueSeverity.MEDIUM, IssueSeverity.LOW, IssueSeverity.INFO].map(
                  (severity) => (
                    <button
                      key={severity}
                      type="button"
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98]
                        ${filterSeverity === severity
                          ? `bg-${severity.toLowerCase()}/20 text-${severity.toLowerCase()}`
                          : ''
                        }
                      `}
                      onClick={() => handleFilterChange(severity)}
                    >
                      {severity}
                      {state.reviewResult.issues.filter(i => i.severity === severity).length > 0 && (
                        <span className="ml-1 text-xs bg-bg/20 rounded px-1">
                          {state.reviewResult.issues.filter(i => i.severity === severity).length}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Issues List */}
            <div className="mt-4">
              {filteredIssues.length > 0 ? (
                <ul className="divide-y divide-border/20">
                  {filteredIssues.map((issue, index) => (
                    <li key={index}>
                      <IssueCard issue={issue} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No issues match the selected filters
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  </>
  )
}

export default ReviewDashboard