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
  const severityColors: Record<IssueSeverity, string> = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-orange-100 text-orange-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
    Info: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full ${severityColors[issue.severity]} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{issue.message}</h3>
          <p className="text-sm text-muted-foreground">
            Line {issue.line} • {issue.category || 'Code Quality'}
          </p>
          {issue.suggestion && (
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>Suggestion:</strong> {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default IssueCard