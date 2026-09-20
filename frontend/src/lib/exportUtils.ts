import type { ReviewResponse } from './types'

export const generateMarkdownReport = (
  review: ReviewResponse,
  code: string,
  language: string,
  mode: string
): string => {
  const date = new Date().toISOString().split('T')[0]
  const criticalCount = review.issues.filter(i => i.severity === 'Critical').length
  const highCount = review.issues.filter(i => i.severity === 'High').length
  const mediumCount = review.issues.filter(i => i.severity === 'Medium').length
  const lowCount = review.issues.filter(i => i.severity === 'Low').length
  const infoCount = review.issues.filter(i => i.severity === 'Info').length

  let md = `# AI Code Review Report

**Date:** ${date}
**Language:** ${language}
**Mode:** ${mode}
**Provider:** ${review.metadata?.provider || 'Unknown'} (${review.metadata?.model || 'default'})
**Lines Analyzed:** ${review.metadata?.lines_reviewed ?? 'N/A'}
**Review Time:** ${review.metadata?.review_time_ms ? `${review.metadata.review_time_ms}ms` : 'N/A'}

---

## 📋 Summary

> ${review.summary}

### Severity Breakdown
- 🔴 **Critical:** ${criticalCount}
- 🟠 **High:** ${highCount}
- 🟡 **Medium:** ${mediumCount}
- 🔵 **Low:** ${lowCount}
- ⚪ **Info:** ${infoCount}

---

## 🔍 Identified Issues (${review.issues.length})

`

  if (review.issues.length === 0) {
    md += `*No issues identified. Code meets expected quality standards.*\n\n`
  } else {
    review.issues.forEach((issue, idx) => {
      md += `### ${idx + 1}. [${issue.severity}] Line ${issue.line}: ${issue.message}\n\n`
      if (issue.category) {
        md += `**Category:** \`${issue.category}\`\n\n`
      }
      md += `**Suggestion:**\n\`\`\`${language}\n${issue.suggestion}\n\`\`\`\n\n`
    })
  }

  md += `---

## 💻 Reviewed Source Code

\`\`\`${language}
${code}
\`\`\`
`

  return md
}

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportAsMarkdown = (
  review: ReviewResponse,
  code: string,
  language: string,
  mode: string
): void => {
  const md = generateMarkdownReport(review, code, language, mode)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadFile(md, `code-review-${language}-${timestamp}.md`, 'text/markdown;charset=utf-8;')
}

export const exportAsJson = (
  review: ReviewResponse,
  code: string,
  language: string,
  mode: string
): void => {
  const data = {
    exportDate: new Date().toISOString(),
    language,
    mode,
    code,
    review,
  }
  const jsonStr = JSON.stringify(data, null, 2)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadFile(jsonStr, `code-review-${language}-${timestamp}.json`, 'application/json;charset=utf-8;')
}
