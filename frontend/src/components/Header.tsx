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

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return (
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-sm">
            🟢 Gemini 2.5-Flash
          </span>
        )
      case 'openai':
        return (
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-sm">
            🟠 OpenAI GPT-4o-mini
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-sm">
            ⚪ Mock Provider
          </span>
        )
    }
  }

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          AI Code Reviewer
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">System:</span>
          {healthLoading ? (
            <span className="animate-pulse">Checking...</span>
          ) : healthError ? (
            <span className="text-sm text-red-400">⚠️ {healthError}</span>
          ) : healthStatus ? (
            getProviderBadge(healthStatus.provider)
          ) : (
            <span className="text-sm text-gray-400">Unknown</span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Mode:</span>
          <div className="flex gap-1">
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
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-150 ${
                  state.selectedMode === mode
                    ? 'bg-accent/20 text-accent hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-transparent text-gray-300 hover:bg-bg/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                onClick={() => dispatch({ type: 'SET_MODE', payload: mode })}
                aria-pressed={state.selectedMode === mode}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-sm font-medium text-gray-300">
            Language:
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
            className="px-3 py-2 text-sm text-white bg-elevated border border-white/20 rounded-md hover:bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </header>
  )
}

export default Header
