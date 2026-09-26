import { useApp } from '../context/AppContext'
import { useEffect, useState } from 'react'
import { checkHealth } from '../lib/api'
import type { HealthResponse } from '../lib/types'
import { SupportedLanguage, ReviewMode } from '../lib/types'

const Header: React.FC = () => {
  const { state, dispatch } = useApp()
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null)
  const [lastCheck, setLastCheck] = useState<number>(0)
  const [healthLoading, setHealthLoading] = useState<boolean>(false)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHealth = async () => {
      setHealthLoading(true)
      setHealthError(null)
      try {
        const result = await checkHealth()
        setHealthStatus(result)
        dispatch({ type: 'SET_HEALTH_STATUS', payload: result })
        setLastCheck(Date.now())
      } catch (err) {
        console.warn('Health check failed:', err)
        setHealthError('Failed to connect to server')
      } finally {
        setHealthLoading(false)
      }
    }

    const now = Date.now()
    if (now - lastCheck > 30000 || lastCheck === 0) {
      fetchHealth()
    }

    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [dispatch, lastCheck])

  const formatModel = (provider: string, model?: string) => {
    if (provider === 'gemini') {
      if (!model || model.includes('2.5')) return 'Gemini 2.5-Flash'
      if (model.includes('3.5')) return 'Gemini 3.5-Flash'
      return `Gemini ${model}`
    }
    if (provider === 'openai') {
      return model ? `OpenAI ${model}` : 'OpenAI GPT-4o-mini'
    }
    return 'Mock Provider'
  }

  const getProviderBadge = (provider: string, model?: string) => {
    switch (provider) {
      case 'gemini':
        return (
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
            🟢 {formatModel(provider, model)}
          </span>
        )
      case 'openai':
        return (
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
            🟠 {formatModel(provider, model)}
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
            ⚪ Mock Provider
          </span>
        )
    }
  }

  return (
    <header className="bg-card border-b border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-200">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>🛡️</span> AI Code Reviewer
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">System:</span>
          {healthLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Checking...</span>
          ) : healthError ? (
            <span className="text-xs text-red-500 dark:text-red-400">⚠️ {healthError}</span>
          ) : healthStatus ? (
            <>
              {getProviderBadge(healthStatus.provider, healthStatus.model)}
              <div aria-live="polite" className="sr-only">
                System status: {healthStatus.provider} is operational
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Unknown</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Review Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Mode:</span>
          <div className="flex gap-1 bg-elevated p-1 rounded-lg border border-border">
            {[
              ReviewMode.COMPREHENSIVE,
              ReviewMode.SECURITY,
              ReviewMode.PERFORMANCE,
              ReviewMode.STYLE,
            ].map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={healthLoading}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  state.selectedMode === mode
                    ? 'bg-accent/20 text-accent font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => dispatch({ type: 'SET_MODE', payload: mode })}
                aria-pressed={state.selectedMode === mode}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Language Select */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="language-select" className="text-xs font-medium text-muted-foreground">
            Lang:
          </label>
          <select
            id="language-select"
            value={state.selectedLanguage}
            onChange={(e) =>
              dispatch({
                type: 'SET_LANGUAGE',
                payload: e.target.value as SupportedLanguage,
              })
            }
            disabled={healthLoading}
            className="px-2.5 py-1.5 text-xs text-foreground bg-elevated border border-border rounded-lg hover:border-accent/40 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            aria-label="Select programming language"
          >
            {[
              SupportedLanguage.PYTHON,
              SupportedLanguage.JAVASCRIPT,
              SupportedLanguage.TYPESCRIPT,
              SupportedLanguage.JAVA,
              SupportedLanguage.GO,
              SupportedLanguage.RUST,
              SupportedLanguage.CPP,
              SupportedLanguage.C,
              SupportedLanguage.CSHARP,
              SupportedLanguage.PHP,
              SupportedLanguage.RUBY,
              SupportedLanguage.KOTLIN,
            ].map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* History view toggle */}
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
            state.viewMode === 'history'
              ? 'bg-accent text-white border-accent'
              : 'bg-elevated text-foreground border-border hover:bg-card'
          }`}
          onClick={() =>
            dispatch({
              type: 'SET_VIEW_MODE',
              payload: state.viewMode === 'history' ? 'current' : 'history',
            })
          }
          aria-label="Toggle review history"
          aria-pressed={state.viewMode === 'history'}
        >
          <span>📜 History</span>
          {state.history.length > 0 && (
            <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
              {state.history.length}
            </span>
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          type="button"
          disabled={healthLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-elevated text-foreground border border-border hover:bg-card transition-all flex items-center gap-1.5 shadow-sm"
          onClick={() => dispatch({ type: 'SET_DARK_MODE', payload: !state.isDark })}
          aria-label="Toggle dark mode"
          aria-pressed={state.isDark}
        >
          <span>{state.isDark ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
      </div>
    </header>
  )
}

export default Header