import './index.css'
import Header from './components/Header'
import CodeEditor from './components/CodeEditor'
import ReviewDashboard from './components/ReviewDashboard'
import { useApp } from './context/AppContext'
import { submitCodeReview } from './lib/api'
import { useEffect, useState } from 'react'

const App: React.FC = () => {
  const { state, dispatch } = useApp()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission (Ctrl+Enter or button click)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!state.editorContent.trim() || state.isLoading || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_REVIEW_RESULT', payload: null })

    try {
      const request = {
        code: state.editorContent,
        language: state.selectedLanguage,
        mode: state.selectedMode,
      }

      const result = await submitCodeReview(request)
      dispatch({ type: 'SET_REVIEW_RESULT', payload: result })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unknown error occurred' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
      setIsSubmitting(false)
    }
  }

  // Handle Ctrl+Enter shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    // Check for Ctrl+Enter (or Cmd+Enter on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Reset error when user starts typing again
  useEffect(() => {
    if (state.error && state.editorContent.trim() !== '') {
      dispatch({ type: 'SET_ERROR', payload: null })
    }
  }, [state.editorContent, state.error, dispatch])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-bg via-bg/50 to-bg">
        <Header />

        <main id="main-content" className="flex-1 flex p-6 gap-6 overflow-hidden">
          {/* Code Editor Column */}
          <div className="flex-1 flex flex-col">
            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="flex-1 flex flex-col"
            >
              <CodeEditor />
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={state.isLoading || isSubmitting || !state.editorContent.trim()}
                  className={`
                    px-6 py-3 text-lg font-medium rounded transition-all duration-200
                    ${state.isLoading || isSubmitting
                      ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                      : 'bg-accent/20 text-accent hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
                    }
                  `}
                >
                  {state.isLoading || isSubmitting ? 'Reviewing...' : 'Review Code'}
                </button>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Ctrl+Enter to submit</span>
                  {!state.isLoading && !isSubmitting && (
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SET_EDITOR_CONTENT', payload: '' })
                        dispatch({ type: 'SET_REVIEW_RESULT', payload: null })
                        dispatch({ type: 'SET_ERROR', payload: null })
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Review Dashboard Column */}
          <div className="flex-1 flex flex-col">
            <ReviewDashboard />
          </div>
        </main>
      </div>
    </>
  )
}

export default App