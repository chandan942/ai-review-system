import React from 'react'
import { useApp } from '../context/AppContext'
import type { ReviewHistoryItem } from '../lib/types'
import { saveHistoryToStorage, clearHistoryFromStorage } from '../lib/storage'
import { exportAsMarkdown, exportAsJson } from '../lib/exportUtils'

const ReviewHistory: React.FC = () => {
  const { state, dispatch } = useApp()

  const handleRestore = (item: ReviewHistoryItem) => {
    dispatch({ type: 'SET_EDITOR_CONTENT', payload: item.code })
    dispatch({ type: 'SET_LANGUAGE', payload: item.language })
    dispatch({ type: 'SET_MODE', payload: item.mode })
    dispatch({ type: 'SET_REVIEW_RESULT', payload: item.result })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'current' })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = state.history.filter((item) => item.id !== id)
    dispatch({ type: 'SET_HISTORY', payload: updated })
    saveHistoryToStorage(updated)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all review history?')) {
      dispatch({ type: 'CLEAR_HISTORY' })
      clearHistoryFromStorage()
    }
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section
      role="region"
      aria-label="Review History"
      className="flex-1 flex flex-col bg-card border border-border/20 rounded-lg overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">Review History</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-accent/20 text-accent rounded-full">
            {state.history.length} {state.history.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {state.history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-[0.98]"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'current' })}
            className="px-3 py-1.5 text-sm font-medium rounded bg-accent/20 text-accent hover:bg-accent/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98]"
          >
            ← Back to Editor
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {state.history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-muted/20 text-muted-foreground mb-4 flex items-center justify-center rounded-lg text-2xl">
              📜
            </div>
            <h3 className="font-semibold text-lg mb-1">No review history yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Code reviews you submit will automatically be saved here so you can revisit them anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.history.map((item) => {
              const issuesCount = item.result.issues.length
              const criticalCount = item.result.issues.filter(
                (i) => i.severity === 'Critical'
              ).length
              const highCount = item.result.issues.filter(
                (i) => i.severity === 'High'
              ).length

              return (
                <div
                  key={item.id}
                  className="p-4 bg-bg/20 hover:bg-bg/40 border border-border/20 rounded-lg transition-all flex flex-col gap-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-medium uppercase bg-elevated border border-border/40 rounded text-foreground">
                        {item.language}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium capitalize bg-accent/10 text-accent rounded">
                        {item.mode} mode
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        title="Export Markdown"
                        aria-label="Export Markdown"
                        onClick={(e) => {
                          e.stopPropagation()
                          exportAsMarkdown(item.result, item.code, item.language, item.mode)
                        }}
                        className="p-1.5 text-xs rounded hover:bg-bg/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        MD ⬇
                      </button>
                      <button
                        title="Export JSON"
                        aria-label="Export JSON"
                        onClick={(e) => {
                          e.stopPropagation()
                          exportAsJson(item.result, item.code, item.language, item.mode)
                        }}
                        className="p-1.5 text-xs rounded hover:bg-bg/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        JSON ⬇
                      </button>
                      <button
                        title="Delete this review"
                        aria-label="Delete this review"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {item.result.summary}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/10">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {issuesCount} {issuesCount === 1 ? 'issue' : 'issues'}
                      </span>
                      {criticalCount > 0 && (
                        <span className="text-red-400 font-medium">
                          {criticalCount} Critical
                        </span>
                      )}
                      {highCount > 0 && (
                        <span className="text-orange-400 font-medium">
                          {highCount} High
                        </span>
                      )}
                      <span>
                        {item.result.metadata?.lines_reviewed || 0} lines
                      </span>
                    </div>

                    <button
                      onClick={() => handleRestore(item)}
                      className="px-3 py-1 text-xs font-semibold rounded bg-accent/20 text-accent hover:bg-accent/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98] self-start sm:self-auto"
                    >
                      Load into Editor ↗
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ReviewHistory
