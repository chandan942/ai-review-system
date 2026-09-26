import { IssueSeverity } from '../lib/types'

interface IssueCardProps {
  issue: {
    line: number
    message: string
    severity: IssueSeverity
    suggestion: string
    category?: string
  }
}

const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const getSeverityClasses = (severity: IssueSeverity): string => {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return 'bg-red-500/10 text-red-400'
      case IssueSeverity.HIGH:
        return 'bg-amber-500/10 text-amber-400'
      case IssueSeverity.MEDIUM:
        return 'bg-yellow-500/10 text-yellow-400'
      case IssueSeverity.LOW:
        return 'bg-blue-500/10 text-blue-400'
      case IssueSeverity.INFO:
        return 'bg-cyan-500/10 text-cyan-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  const handleCopyFix = () => {
    navigator.clipboard.writeText(issue.suggestion)
  }

  const handleHighlight = () => {
    alert(`Highlighting line ${issue.line}`)
  }

  return (
    <div className="p-4 flex flex-col gap-2 hover:bg-bg/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full ${getSeverityClasses(issue.severity)} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{issue.message}</h3>
          <p className="text-sm text-muted-foreground">
            L{issue.line} • {issue.category || 'Code Quality'}
          </p>
          {issue.suggestion && (
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>Suggestion:</strong> {issue.suggestion}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCopyFix}
              className="px-3 py-1 text-xs font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98] transition-colors"
            >
              Copy Fix
            </button>
            <button
              onClick={handleHighlight}
              className="px-3 py-1 text-xs font-medium rounded hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/20 active:scale-[0.98] transition-colors"
            >
              Highlight in Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IssueCard