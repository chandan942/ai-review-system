export const SupportedLanguage = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  JAVA: "java",
  GO: "go",
  RUST: "rust",
  CPP: "cpp",
  C: "c",
  CSHARP: "csharp",
  PHP: "php",
  RUBY: "ruby",
  KOTLIN: "kotlin",
} as const

export type SupportedLanguage = typeof SupportedLanguage[keyof typeof SupportedLanguage]

export const ReviewMode = {
  COMPREHENSIVE: "comprehensive",
  SECURITY: "security",
  PERFORMANCE: "performance",
  STYLE: "style",
} as const

export type ReviewMode = typeof ReviewMode[keyof typeof ReviewMode]

export const IssueSeverity = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
} as const

export type IssueSeverity = typeof IssueSeverity[keyof typeof IssueSeverity]

export interface ReviewIssue {
  line: number
  message: string
  severity: IssueSeverity
  suggestion: string
  category?: string
}

export interface ReviewMetadata {
  language: string
  mode: string
  lines_reviewed: number
  review_time_ms: number
  provider: string
  model: string
  cached: boolean
  request_id?: string
}

export interface ReviewResponse {
  summary: string
  issues: ReviewIssue[]
  metadata: ReviewMetadata
}

export interface HealthResponse {
  status: string
  provider: string
  model: string
  cache_size: number
  supported_languages: string[]
  supported_modes: string[]
  version: string
}

export interface CodeRequest {
  code: string
  language: SupportedLanguage
  mode: ReviewMode
}
