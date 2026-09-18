# Software Requirements Specification (SRS)
## AI Code Review System

**Version:** 1.0.0  
**Date:** 2026-09-18  
**Status:** Backend v1.0.0 Complete | Frontend In Progress  

---

## 1. Functional Requirements

### 1.1 Code Submission (FR-100)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-101 | System shall accept code input as plain text via a text area | P0 | ✅ Implemented (backend API) |
| FR-102 | System shall accept a language parameter (enum: python, javascript, typescript, java, go, rust, cpp, c, csharp, php, ruby, kotlin) | P0 | ✅ Implemented (12 languages) |
| FR-103 | System shall reject empty code submissions with error message | P0 | ✅ Implemented (422 Validation Error) |
| FR-104 | System shall reject submissions exceeding 10,000 characters | P0 | ✅ Implemented (actually 15,000 chars in code) |
| FR-105 | System shall trim leading/trailing whitespace from code before processing | P1 | ✅ Implemented (field validator) |

### 1.2 AI Review Engine (FR-200)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-201 | System shall send submitted code to an AI model for analysis | P0 | ✅ Implemented (Gemini, OpenAI, Mock providers) |
| FR-202 | System shall parse AI response into structured issue objects | P0 | ✅ Implemented (Pydantic models with validation) |
| FR-203 | Each issue shall contain: `line` (int), `message` (string), `severity` (enum), `suggestion` (string) | P0 | ✅ Implemented (ReviewIssue model) |
| FR-204 | System shall classify issues into severity levels: Critical, High, Medium, Low | P0 | ✅ Implemented (IssueSeverity enum with Critical/High/Medium/Low) |
| FR-205 | System shall return a summary string describing the overall code quality | P0 | ✅ Implemented (ReviewResponse.summary field) |
| FR-206 | System shall timeout AI requests after 30 seconds and return an error | P0 | ✅ Implemented (ReviewTimeoutError + ProviderError handling) |
| FR-207 | System shall fallback gracefully if AI service is unavailable | P1 | ✅ Implemented (primary → fallback cascade with configurable providers) |
| FR-208 | System shall support swapping AI providers (Gemini, OpenAI) via configuration | P1 | ✅ Implemented (REVIEW_PROVIDER env var + factory pattern) |
| FR-209 | System shall cache review responses to reduce latency and API costs | P1 | ✅ Implemented (SHA-256 hash-based TTL LRU cache) |
| FR-210 | System shall implement rate limiting to prevent abuse | P1 | ✅ Implemented (sliding-window IP rate limiter) |
| FR-211 | System shall provide distributed tracing via X-Request-ID | P1 | ✅ Implemented (middleware + contextvars) |
| FR-212 | System shall defend against prompt injection attacks | P0 | ✅ Implemented (XML `<user_code>` boundary isolation) |

### 1.3 Results Display (FR-300)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-301 | Frontend shall display the review summary at the top of results | P0 | 🔲 Pending (Phase 3) |
| FR-302 | Frontend shall display each issue as a card with line, message, severity, and suggestion | P0 | 🔲 Pending (Phase 3) |
| FR-303 | Frontend shall color-code issues by severity (Critical=red, High=orange, Medium=yellow, Low=blue) | P0 | 🔲 Pending (Phase 3) |
| FR-304 | Frontend shall show a loading state while review is in progress | P0 | 🔲 Pending (Phase 3) |
| FR-305 | Frontend shall display error messages if the review fails | P0 | 🔲 Pending (Phase 3) |
| FR-306 | Frontend shall show an empty state when no issues are found | P0 | 🔲 Pending (Phase 3) |
| FR-307 | Frontend shall display the total count of issues by severity | P1 | 🔲 Pending (Phase 3) |

### 1.4 Health & Status (FR-400)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-401 | System shall expose a `GET /` endpoint returning API status | P0 | ✅ Implemented (returns message + version) |
| FR-402 | System shall expose a `GET /health` endpoint for monitoring | P1 | ✅ Implemented (returns provider, model, cache size, supported languages/modes, version) |

---

## 2. User Roles & Permissions (MVP)

| Role | Description | Permissions |
|---|---|---|
| **Anonymous User** | Any visitor to the web app | Submit code, view review results |

> [!NOTE]
> MVP has no authentication. All users are anonymous. Auth will be added in a future phase for review history and GitHub integration.

### Post-MVP Roles

| Role | Permissions |
|---|---|
| **Registered User** | Everything anonymous + review history, saved preferences |
| **Admin** | User management, system configuration, usage analytics |

---

## 3. Business Rules

### BR-01: Supported Languages
The system shall support the following languages at MVP launch:
- Python
- JavaScript
- TypeScript

Post-MVP additions: Java, Go, Rust, C++

### BR-02: Code Size Limits
- Minimum: 1 character (after trimming whitespace)
- Maximum: 10,000 characters (~300 lines)
- Submissions outside this range shall be rejected with a descriptive error

### BR-03: Severity Classification

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | Security vulnerabilities, data loss risks | SQL injection, hardcoded secrets, unvalidated input |
| **High** | Bugs likely to cause runtime failures | Null reference, infinite loops, race conditions |
| **Medium** | Code quality issues affecting maintainability | Poor naming, missing error handling, code duplication |
| **Low** | Style and convention suggestions | Formatting, unused imports, missing docstrings |

### BR-04: Rate Limiting (Post-MVP)
- Anonymous users: 10 reviews per hour per IP
- Registered users: 50 reviews per hour

---

## 4. Data Requirements

### 4.1 Data Models

#### CodeReview Request
```
{
  code: string          // required, 1-10000 chars
  language: string      // required, enum of supported languages
}
```

#### ReviewIssue
```
{
  line: integer         // 1-indexed line number
  message: string       // description of the issue
  severity: string      // "Critical" | "High" | "Medium" | "Low"
  suggestion: string    // how to fix the issue
}
```

#### ReviewResponse
```
{
  summary: string       // overall review summary
  issues: ReviewIssue[] // array of found issues
  metadata: {
    language: string
    lines_reviewed: integer
    review_time_ms: integer
  }
}
```

### 4.2 Data Storage (Post-MVP)
- Reviews stored in PostgreSQL with user association
- Code snippets stored as text (not files)
- Retention: 90 days for anonymous, unlimited for registered users

---

## 5. Validation Rules

| Field | Rule | Error Message |
|---|---|---|
| `code` | Required, non-empty after trim | "Code is required" |
| `code` | Max 10,000 characters | "Code exceeds maximum length of 10,000 characters" |
| `language` | Must be one of supported languages enum | "Unsupported language. Supported: python, javascript, typescript" |

---

## 6. Authentication & Authorization (Post-MVP)

- **Strategy:** JWT-based authentication
- **Provider:** Email/password initially; GitHub OAuth for PR integration
- **Session:** Stateless via JWT tokens (access: 15min, refresh: 7d)
- **MVP:** No auth — all endpoints are public

---

## 7. Error Handling

### 7.1 API Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

### 7.2 Error Codes

| HTTP Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input (empty code, bad language) |
| 408 | `REVIEW_TIMEOUT` | AI model took > 30 seconds |
| 422 | `UNPROCESSABLE_ENTITY` | Pydantic validation failure |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests (post-MVP) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI provider is down |

---

## 8. Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User submits empty string | Return 400 with "Code is required" |
| EC-02 | User submits only whitespace | Return 400 with "Code is required" (after trim) |
| EC-03 | User submits 15,000 characters | Return 400 with max length error |
| EC-04 | User submits binary/non-text data | Return 400 with "Invalid input" |
| EC-05 | AI returns malformed response | Log error, return 500 with generic message |
| EC-06 | AI returns zero issues | Return success with empty issues array and positive summary |
| EC-07 | AI request times out | Return 408 with timeout message |
| EC-08 | User submits code with prompt injection attempts | System prompt guardrails prevent manipulation |
| EC-09 | Concurrent submissions from same user | Process independently (no queue needed for MVP) |
| EC-10 | Network failure to AI provider mid-request | Return 503 with retry suggestion |

---

## 9. Security Requirements

| ID | Requirement |
|---|---|
| SEC-01 | All API communication shall use HTTPS in production |
| SEC-02 | User-submitted code shall never be executed on the server |
| SEC-03 | AI prompts shall use system-level instructions that cannot be overridden by user input |
| SEC-04 | API keys shall be stored in environment variables, never in source code |
| SEC-05 | CORS shall be restricted to the frontend domain in production |
| SEC-06 | Input size limits shall prevent denial-of-service via large payloads |
| SEC-07 | No user-submitted code shall be logged in production (privacy) |

---

## 10. Performance Requirements

| Metric | Target |
|---|---|
| API response time (mock reviewer) | < 200ms |
| API response time (AI reviewer) | < 15 seconds (p95) |
| Frontend initial load | < 3 seconds |
| Concurrent users supported | 50 (MVP) |
| Max request payload | 50 KB |

---

## 11. Acceptance Criteria (Testable)

| ID | Criterion | Test Method |
|---|---|---|
| AC-01 | Submitting valid Python code returns a ReviewResponse with ≥0 issues | API test with `httpx` |
| AC-02 | Submitting empty code returns HTTP 400 | API test |
| AC-03 | Submitting unsupported language returns HTTP 400 | API test |
| AC-04 | Submitting code > 10,000 chars returns HTTP 400 | API test |
| AC-05 | Each issue in response has line, message, severity, and suggestion fields | Schema validation test |
| AC-06 | Severity is always one of: Critical, High, Medium, Low | Schema validation test |
| AC-07 | Review completes within 30 seconds or returns timeout error | Load test |
| AC-08 | Frontend displays review results matching API response | E2E test |
| AC-09 | Frontend shows loading spinner during review | Manual / E2E test |
| AC-10 | Frontend shows error message on API failure | E2E test with mocked failure |
